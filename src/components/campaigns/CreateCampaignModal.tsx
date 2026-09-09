/**
 * @license
 * Create Crowdfunding Appeal Workflow Modal
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  HeartHandshake, 
  Sparkles, 
  GraduationCap, 
  HeartPulse, 
  AlertTriangle, 
  Utensils, 
  Building2, 
  HandHeart, 
  Upload, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  Calendar, 
  IndianRupee, 
  FileText, 
  FileCheck, 
  AlertCircle, 
  Lock, 
  Eye, 
  Image as ImageIcon, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  UserCheck, 
  Phone, 
  Mail, 
  MapPin, 
  File, 
  ShieldAlert, 
  CheckSquare
} from 'lucide-react';
import { 
  CampaignCategory, 
  CampaignSupportingDocument, 
  CampaignSupportingImage, 
  CrowdfundingCampaign 
} from '../../types';
import { 
  createCampaign, 
  saveCampaignDraft, 
  submitCampaignAppeal, 
  CAMPAIGN_CATEGORY_CONFIG 
} from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  uploadCampaignMedia, 
  validateImageFile, 
  validateDocumentFile 
} from '../../lib/storage';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (campaignId: string) => void;
  initialCampaign?: CrowdfundingCampaign | null;
}

const DOCUMENT_CATEGORIES = [
  'Tuition Fee Structure / Institution Bona Fide',
  'Medical Prescription / Hospital Estimate / Bill',
  'Income Certificate / BPL Card / Ration Proof',
  'Identity / Locality Verification Proof',
  'Other Official Documentation / Verification Letter'
];

const RELATIONSHIP_OPTIONS = [
  'Self (I am the direct beneficiary)',
  'Parent / Immediate Family / Guardian',
  'Relative / Extended Family',
  'FET Registered Volunteer',
  'Community Representative / Social Worker',
  'Educational Institution Faculty / Admin',
  'Other'
];

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCampaign
}) => {
  const { currentUser, userProfile } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Workflow Steps: 1..8
  // 1: Appeal Info
  // 2: Beneficiary
  // 3: Funding Details
  // 4: Verification Documents (Private)
  // 5: Cause Gallery
  // 6: Appeal Creator Details
  // 7: Declaration
  // 8: Review & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);

  // --- Step 1: Appeal Info ---
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('education');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('Telangana');
  const [district, setDistrict] = useState('Hyderabad');
  const [city, setCity] = useState('');

  // Cover Photo State
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [coverFileName, setCoverFileName] = useState<string>('');
  const [coverUploadProgress, setCoverUploadProgress] = useState<number>(0);
  const [coverUploading, setCoverUploading] = useState<boolean>(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Step 2: Beneficiary Details ---
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryDescription, setBeneficiaryDescription] = useState('');
  const [targetInstitution, setTargetInstitution] = useState('');
  const [beneficiaryLocation, setBeneficiaryLocation] = useState('');

  // --- Step 3: Funding Details ---
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [fundUtilizationNotes, setFundUtilizationNotes] = useState('');

  // --- Step 4: Verification Documents (PRIVATE) ---
  const [supportingDocuments, setSupportingDocuments] = useState<CampaignSupportingDocument[]>([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [docCustomTitle, setDocCustomTitle] = useState<string>('');
  const [docUploadProgress, setDocUploadProgress] = useState<number>(0);
  const [docUploading, setDocUploading] = useState<boolean>(false);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Step 5: Cause Gallery ---
  const [supportingImages, setSupportingImages] = useState<CampaignSupportingImage[]>([]);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<number>(0);
  const [galleryUploading, setGalleryUploading] = useState<boolean>(false);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Step 6: Appeal Creator Details ---
  const [creatorFullName, setCreatorFullName] = useState(
    userProfile?.fullLegalName || userProfile?.displayName || currentUser?.displayName || ''
  );
  const [creatorParentage, setCreatorParentage] = useState(
    userProfile?.fatherName ? `S/o ${userProfile.fatherName}` : userProfile?.guardianName ? `Ward of ${userProfile.guardianName}` : ''
  );
  const [creatorContactPhone, setCreatorContactPhone] = useState(userProfile?.mobileNumber || userProfile?.phoneNumber || '');
  const [creatorAlternatePhone, setCreatorAlternatePhone] = useState('');
  const [creatorEmailAddress, setCreatorEmailAddress] = useState(currentUser?.email || userProfile?.email || '');
  const [creatorResidentialLocation, setCreatorResidentialLocation] = useState(userProfile?.address || '');
  const [creatorState, setCreatorState] = useState(userProfile?.state || 'Telangana');
  const [creatorDistrict, setCreatorDistrict] = useState(userProfile?.district || 'Hyderabad');
  const [creatorCityTownVillage, setCreatorCityTownVillage] = useState(userProfile?.city || '');
  const [creatorMemberId, setCreatorMemberId] = useState(userProfile?.membershipId || userProfile?.studentId || userProfile?.volunteerId || '');
  const [relationshipToBeneficiary, setRelationshipToBeneficiary] = useState<string>(RELATIONSHIP_OPTIONS[0]);

  // --- Step 7: Declarations ---
  const [truthDeclaration, setTruthDeclaration] = useState(false);
  const [trustDisbursalDeclaration, setTrustDisbursalDeclaration] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Populate from initialCampaign if passed (e.g. editing a draft or correcting an appeal)
  useEffect(() => {
    if (initialCampaign) {
      setTitle(initialCampaign.title || '');
      setCategory(initialCampaign.category || 'education');
      setDescription(initialCampaign.description || '');
      setLocation(initialCampaign.location || '');
      setState(initialCampaign.state || 'Telangana');
      setDistrict(initialCampaign.district || 'Hyderabad');
      setCity(initialCampaign.city || '');
      setCoverImageUrl(initialCampaign.coverImageUrl || '');
      setBeneficiaryName(initialCampaign.beneficiaryName || '');
      setBeneficiaryDescription(initialCampaign.beneficiaryDescription || '');
      setTargetInstitution(initialCampaign.targetInstitution || '');
      setBeneficiaryLocation(initialCampaign.beneficiaryLocation || '');
      setTargetAmount(initialCampaign.targetAmount ? String(initialCampaign.targetAmount) : '');
      setStartDate(initialCampaign.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(initialCampaign.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setFundUtilizationNotes(initialCampaign.fundUtilizationNotes || '');
      setSupportingDocuments(initialCampaign.supportingDocuments || []);
      setSupportingImages(initialCampaign.supportingImages || []);
      setCreatorFullName(initialCampaign.creatorFullName || initialCampaign.contactPersonName || userProfile?.fullLegalName || currentUser?.displayName || '');
      setCreatorParentage(initialCampaign.creatorParentage || (userProfile?.fatherName ? `S/o ${userProfile.fatherName}` : ''));
      setCreatorContactPhone(initialCampaign.creatorContactPhone || initialCampaign.contactPhone || userProfile?.mobileNumber || '');
      setCreatorAlternatePhone(initialCampaign.creatorAlternatePhone || '');
      setCreatorEmailAddress(initialCampaign.creatorEmailAddress || initialCampaign.contactEmail || currentUser?.email || '');
      setCreatorResidentialLocation(initialCampaign.creatorResidentialLocation || userProfile?.address || '');
      setCreatorState(initialCampaign.creatorState || 'Telangana');
      setCreatorDistrict(initialCampaign.creatorDistrict || 'Hyderabad');
      setCreatorCityTownVillage(initialCampaign.creatorCityTownVillage || '');
      setCreatorMemberId(initialCampaign.creatorMemberId || '');
      setRelationshipToBeneficiary(initialCampaign.relationshipToBeneficiary || RELATIONSHIP_OPTIONS[0]);
      setTruthDeclaration(Boolean(initialCampaign.declarationAccepted));
      setTrustDisbursalDeclaration(Boolean(initialCampaign.declarationAccepted));
      setTermsAccepted(Boolean(initialCampaign.termsAccepted));
    }
  }, [initialCampaign, isOpen]);

  if (!isOpen) return null;

  // ==========================================
  // UPLOAD HANDLERS
  // ==========================================

  // 1. Cover Photo Upload
  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      showError(validation.error || 'Invalid image file.');
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
      return;
    }

    setCoverUploading(true);
    setCoverUploadProgress(10);
    try {
      const result = await uploadCampaignMedia(file, 'covers', (progress) => {
        setCoverUploadProgress(progress);
      });
      setCoverImageUrl(result.url);
      setCoverFileName(result.fileName);
      showSuccess('Cover photo uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading cover image:', err);
      showError(err?.message || 'Failed to upload cover photo. Please check image format and try again.');
    } finally {
      setCoverUploading(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    setCoverImageUrl('');
    setCoverFileName('');
    setCoverUploadProgress(0);
  };

  // 2. Verification Document Upload
  const handleDocFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDocumentFile(file, 15);
    if (!validation.valid) {
      showError(validation.error || 'Invalid document file.');
      if (docFileInputRef.current) docFileInputRef.current.value = '';
      return;
    }

    const docName = docCustomTitle.trim() || selectedDocCategory;

    setDocUploading(true);
    setDocUploadProgress(15);
    try {
      const result = await uploadCampaignMedia(file, 'private_documents', (progress) => {
        setDocUploadProgress(progress);
      });

      const newDoc: CampaignSupportingDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: docName,
        type: selectedDocCategory,
        url: result.url,
        uploadedAt: new Date().toISOString(),
        sizeBytes: result.sizeBytes,
        fileName: result.fileName,
        mimeType: result.mimeType,
        isPrivate: true
      };

      setSupportingDocuments(prev => [...prev, newDoc]);
      setDocCustomTitle('');
      showSuccess(`Verification document "${docName}" attached securely!`);
    } catch (err: any) {
      console.error('Error uploading verification document:', err);
      showError(err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setDocUploading(false);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (id: string) => {
    setSupportingDocuments(prev => prev.filter(d => d.id !== id));
  };

  // 3. Cause Gallery Photos Upload
  const handleGalleryFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGalleryUploading(true);
    setGalleryUploadProgress(10);

    const newImages: CampaignSupportingImage[] = [];
    let uploadErrors = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file, 10);
      if (!validation.valid) {
        uploadErrors++;
        continue;
      }

      try {
        const result = await uploadCampaignMedia(file, 'gallery', (pct) => {
          const stepPct = Math.round(((i + pct / 100) / files.length) * 100);
          setGalleryUploadProgress(stepPct);
        });

        newImages.push({
          id: `img_${Date.now()}_${i}`,
          url: result.url,
          fileName: result.fileName,
          uploadedAt: new Date().toISOString()
        });
      } catch (err) {
        uploadErrors++;
      }
    }

    if (newImages.length > 0) {
      setSupportingImages(prev => [...prev, ...newImages]);
      showSuccess(`${newImages.length} cause photo(s) uploaded!`);
    }

    if (uploadErrors > 0) {
      showError(`${uploadErrors} file(s) could not be uploaded due to size/type limits.`);
    }

    setGalleryUploading(false);
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
  };

  const handleRemoveGalleryImage = (id: string) => {
    setSupportingImages(prev => prev.filter(img => img.id !== id));
  };

  const handleUpdateGalleryCaption = (id: string, caption: string) => {
    setSupportingImages(prev => prev.map(img => img.id === id ? { ...img, caption } : img));
  };

  // ==========================================
  // STEP VALIDATION & NAVIGATION
  // ==========================================
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!title.trim()) {
          showError('Please enter an Appeal Title.');
          return false;
        }
        if (!description.trim() || description.trim().length < 20) {
          showError('Please enter a comprehensive narrative describing the case (minimum 20 characters).');
          return false;
        }
        return true;

      case 2:
        if (!beneficiaryName.trim()) {
          showError('Please enter the Beneficiary Name or Student Name.');
          return false;
        }
        if (!beneficiaryDescription.trim()) {
          showError('Please provide the beneficiary background or situation.');
          return false;
        }
        return true;

      case 3:
        if (!targetAmount || Number(targetAmount) < 1000) {
          showError('Please enter a valid target goal amount (minimum ₹1,000).');
          return false;
        }
        if (!startDate || !endDate) {
          showError('Please select both campaign start and end dates.');
          return false;
        }
        return true;

      case 4:
        // Verification documents are optional during initial creation, though recommended for expedited Board approval
        return true;

      case 5:
        // Gallery is optional but recommended
        return true;

      case 6:
        if (!creatorFullName.trim()) {
          showError('Please enter the Appeal Creator Full Legal Name.');
          return false;
        }
        if (!creatorParentage.trim()) {
          showError("Please enter the Creator Parentage / Father's or Guardian's Name.");
          return false;
        }
        if (!creatorContactPhone.trim()) {
          showError('Please enter a Primary Contact Number.');
          return false;
        }
        if (!creatorEmailAddress.trim()) {
          showError('Please enter the Creator Email Address.');
          return false;
        }
        if (!creatorResidentialLocation.trim()) {
          showError('Please enter the Creator Residential Address/Location.');
          return false;
        }
        return true;

      case 7:
        if (!truthDeclaration || !trustDisbursalDeclaration || !termsAccepted) {
          showError('Please accept all institutional declarations and guidelines to proceed to final review.');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(8, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // ==========================================
  // SAVE AS DRAFT
  // ==========================================
  const handleSaveDraft = async () => {
    if (!currentUser) {
      showError('Please authenticate to save your draft.');
      return;
    }
    if (!title.trim()) {
      showError('Please enter at least an Appeal Title to save a draft.');
      return;
    }

    setSavingDraft(true);
    try {
      const numTarget = Number(targetAmount) || 0;
      const draftId = await saveCampaignDraft(
        {
          title: title.trim(),
          category,
          categoryLabel: CAMPAIGN_CATEGORY_CONFIG[category]?.label || 'Charitable Appeal',
          description: description.trim(),
          beneficiaryName: beneficiaryName.trim(),
          beneficiaryDescription: beneficiaryDescription.trim(),
          targetInstitution: targetInstitution.trim(),
          beneficiaryLocation: beneficiaryLocation.trim(),
          targetAmount: numTarget,
          requiredAmount: numTarget,
          location: location.trim() || `${district}, ${state}`,
          state,
          district,
          city: city.trim() || district,
          startDate,
          endDate,
          fundUtilizationNotes: fundUtilizationNotes.trim(),
          coverImageUrl: coverImageUrl.trim(),
          supportingImages,
          supportingDocuments,
          contactPersonName: creatorFullName.trim(),
          contactPhone: creatorContactPhone.trim(),
          contactEmail: creatorEmailAddress.trim(),
          creatorFullName: creatorFullName.trim(),
          creatorParentage: creatorParentage.trim(),
          creatorContactPhone: creatorContactPhone.trim(),
          creatorAlternatePhone: creatorAlternatePhone.trim() || '',
          creatorEmailAddress: creatorEmailAddress.trim(),
          creatorResidentialLocation: creatorResidentialLocation.trim(),
          creatorState,
          creatorDistrict,
          creatorCityTownVillage: creatorCityTownVillage.trim() || '',
          creatorMemberId: creatorMemberId.trim() || '',
          relationshipToBeneficiary,
          declarationAccepted: truthDeclaration && trustDisbursalDeclaration,
          termsAccepted,
          creatorUid: currentUser.uid,
          creatorEmail: currentUser.email || creatorEmailAddress.trim(),
          creatorName: creatorFullName.trim()
        },
        {
          uid: currentUser.uid,
          email: currentUser.email || creatorEmailAddress.trim(),
          displayName: creatorFullName.trim()
        },
        initialCampaign?.id
      );

      showSuccess('Draft saved successfully! You can resume and submit it anytime from your dashboard.');
      if (onSuccess) {
        onSuccess(draftId);
      }
    } catch (err: any) {
      console.error('Error saving campaign draft:', err);
      showError(err?.message || 'Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  // ==========================================
  // FINAL SUBMISSION
  // ==========================================
  const handleSubmit = async () => {
    if (!currentUser) {
      showError('Please authenticate to submit your crowdfunding appeal.');
      return;
    }

    if (!truthDeclaration || !trustDisbursalDeclaration || !termsAccepted) {
      showError('Please accept the institutional declarations.');
      return;
    }

    const numTarget = Number(targetAmount);
    if (isNaN(numTarget) || numTarget < 1000) {
      showError('Target amount must be at least ₹1,000.');
      return;
    }

    setSubmitting(true);
    try {
      const campaignId = await submitCampaignAppeal(
        {
          title: title.trim(),
          category,
          categoryLabel: CAMPAIGN_CATEGORY_CONFIG[category]?.label || 'Charitable Appeal',
          description: description.trim(),
          beneficiaryName: beneficiaryName.trim(),
          beneficiaryDescription: beneficiaryDescription.trim(),
          targetInstitution: targetInstitution.trim(),
          beneficiaryLocation: beneficiaryLocation.trim(),
          targetAmount: numTarget,
          requiredAmount: numTarget,
          location: location.trim() || `${district}, ${state}`,
          state,
          district,
          city: city.trim() || district,
          startDate,
          endDate,
          fundUtilizationNotes: fundUtilizationNotes.trim(),
          coverImageUrl: coverImageUrl.trim(),
          supportingImages,
          supportingDocuments,
          contactPersonName: creatorFullName.trim(),
          contactPhone: creatorContactPhone.trim(),
          contactEmail: creatorEmailAddress.trim(),
          
          // Appeal Creator Detailed Information
          creatorFullName: creatorFullName.trim(),
          creatorParentage: creatorParentage.trim(),
          creatorContactPhone: creatorContactPhone.trim(),
          creatorAlternatePhone: creatorAlternatePhone.trim() || '',
          creatorEmailAddress: creatorEmailAddress.trim(),
          creatorResidentialLocation: creatorResidentialLocation.trim(),
          creatorState,
          creatorDistrict,
          creatorCityTownVillage: creatorCityTownVillage.trim() || '',
          creatorMemberId: creatorMemberId.trim() || '',
          relationshipToBeneficiary,

          declarationAccepted: true,
          termsAccepted: true,
          creatorUid: currentUser.uid,
          creatorEmail: currentUser.email || creatorEmailAddress.trim(),
          creatorName: creatorFullName.trim()
        },
        {
          uid: currentUser.uid,
          email: currentUser.email || creatorEmailAddress.trim(),
          displayName: creatorFullName.trim()
        },
        initialCampaign?.id
      );

      showSuccess('Appeal submitted successfully! It is now in Pending Review with the Board.');
      if (onSuccess) {
        onSuccess(campaignId);
      }
      onClose();
    } catch (err: any) {
      console.error('Error submitting campaign appeal:', err);
      showError(err?.message || 'Failed to submit campaign appeal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const stepsList = [
    { num: 1, label: 'Appeal Info' },
    { num: 2, label: 'Beneficiary' },
    { num: 3, label: 'Funding' },
    { num: 4, label: 'Verification Docs' },
    { num: 5, label: 'Cause Gallery' },
    { num: 6, label: 'Creator Details' },
    { num: 7, label: 'Declaration' },
    { num: 8, label: 'Review & Submit' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="create-campaign-modal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[94vh] overflow-y-auto flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300">
              <HeartHandshake className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Create Fundraising Appeal</h2>
              <p className="text-xs text-slate-500">Step {currentStep} of 8 — {stepsList[currentStep - 1]?.label}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            id="close-create-appeal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar & Nav Pills */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
            {stepsList.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep || validateCurrentStep()) {
                    setCurrentStep(s.num);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentStep === s.num
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : currentStep > s.num
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                  currentStep === s.num ? 'bg-white text-emerald-900' : currentStep > s.num ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {currentStep > s.num ? '✓' : s.num}
                </span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Form Content */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          
          {/* ========================================================================= */}
          {/* STEP 1: APPEAL INFORMATION */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">1. Appeal Information & Cover Image</h3>
                <p className="text-xs text-slate-500">Provide the title, category, full narrative, and primary cover photo for your appeal.</p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Appeal Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Higher Education Fee Support for Deserving Engineering Student"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  id="appeal-title-input"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Cause Category <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(CAMPAIGN_CATEGORY_CONFIG) as CampaignCategory[]).map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-300 text-emerald-950 font-black'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold">{CAMPAIGN_CATEGORY_CONFIG[cat].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Narrative Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Detailed Case Narrative & Urgency <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain the background, family economic circumstances, institution requirements, urgency of funds, and how the aid will be utilized..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  id="appeal-description-input"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">City / Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad / Warangal"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Upload Cover Photo */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Upload Cover Photo <span className="text-slate-400 font-normal text-[11px]">(Optional)</span></span>
                  <span className="text-[10px] font-normal text-slate-400">JPG, JPEG, PNG or WebP (Max 10MB)</span>
                </label>

                {coverImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-52 group">
                    <img 
                      src={coverImageUrl} 
                      alt="Cover Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        className="py-2 px-4 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Replace Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => coverFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-6 text-center transition-all cursor-pointer space-y-2"
                    id="upload-cover-photo-dropzone"
                  >
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {coverUploading ? `Uploading Cover Photo... ${coverUploadProgress}%` : 'Click to select or drag & drop cover image'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports high-resolution JPG, PNG and WebP files</p>
                    </div>

                    {coverUploading && (
                      <div className="w-48 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-emerald-600 h-full transition-all" style={{ width: `${coverUploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}

                <input 
                  type="file" 
                  ref={coverFileInputRef} 
                  onChange={handleCoverFileSelect} 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  id="cover-file-input"
                />
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: BENEFICIARY DETAILS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">2. Beneficiary Information</h3>
                <p className="text-xs text-slate-500">Provide details about the student, patient, or community member receiving the funds.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Beneficiary Full Legal Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Syed Daniyal Ahmed / Fatima Begum"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  id="beneficiary-name-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Educational Institution / Hospital / Target Entity
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muffakham Jah College of Engineering & Technology / Osmania General Hospital"
                  value={targetInstitution}
                  onChange={(e) => setTargetInstitution(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  id="target-institution-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Beneficiary Situation & Financial Need <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe academic track record, current course/semester, disease diagnosis, or economic vulnerability..."
                  value={beneficiaryDescription}
                  onChange={(e) => setBeneficiaryDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  id="beneficiary-description-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Beneficiary Residence Address / Locality
                </label>
                <input
                  type="text"
                  placeholder="e.g. H.No 18-2-42, Bandlaguda, Chandrayangutta, Hyderabad"
                  value={beneficiaryLocation}
                  onChange={(e) => setBeneficiaryLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: FUNDING DETAILS */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">3. Funding Target & Timeline</h3>
                <p className="text-xs text-slate-500">Set the audited financial target in INR and the campaign timeline window.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Target Goal Amount (INR ₹) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    placeholder="e.g. 75000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    id="target-amount-input"
                  />
                </div>
                {targetAmount && Number(targetAmount) > 0 && (
                  <p className="text-xs font-bold text-emerald-800">
                    Target: {formatINR(Number(targetAmount))}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Campaign Start Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Target End Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Purpose of Funds Breakdown
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tuition Fee: ₹50,000 | Examination & Lab Fee: ₹15,000 | Books & Transportation: ₹10,000"
                  value={fundUtilizationNotes}
                  onChange={(e) => setFundUtilizationNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: VERIFICATION DOCUMENTS (STRICTLY PRIVATE) */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-base font-black text-slate-900">4. Private Verification Documents</h3>
                </div>
                <p className="text-xs text-slate-500">Upload official fee structures, estimates, bonafides, or income certificates for Board scrutiny.</p>
              </div>

              {/* CRITICAL PRIVACY GUARANTEE BANNER */}
              <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-2 border border-emerald-800 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-extrabold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Confidentiality & Privacy Protection</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Verification documents uploaded here are <strong>strictly PRIVATE</strong>. They will only be accessible to authorized FET India Reviewers and yourself as the creator. They will <strong>NOT</strong> be displayed on public appeal pages or exposed to unauthenticated visitors.
                </p>
              </div>

              {/* Upload New Document Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Attach Official Verification Document</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Document Type / Category</label>
                    <select
                      value={selectedDocCategory}
                      onChange={(e) => setSelectedDocCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                      id="doc-category-select"
                    >
                      {DOCUMENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Custom Document Label (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. MJCET 3rd Year Fee Demand Note 2026"
                      value={docCustomTitle}
                      onChange={(e) => setDocCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                      id="doc-title-input"
                    />
                  </div>
                </div>

                <div 
                  onClick={() => docFileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-5 text-center transition-all cursor-pointer space-y-1.5"
                  id="upload-verification-doc-btn"
                >
                  <FileText className="w-8 h-8 mx-auto text-emerald-700" />
                  <p className="text-xs font-black text-emerald-950">
                    {docUploading ? `Uploading Document... ${docUploadProgress}%` : 'Click to Upload PDF or Scanned Document Photo'}
                  </p>
                  <p className="text-[11px] text-slate-500">Supports PDF, JPG, PNG & WebP (Max 15MB)</p>
                  
                  {docUploading && (
                    <div className="w-48 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-emerald-600 h-full transition-all" style={{ width: `${docUploadProgress}%` }} />
                    </div>
                  )}
                </div>

                <input 
                  type="file" 
                  ref={docFileInputRef} 
                  onChange={handleDocFileSelect} 
                  accept="application/pdf,image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  id="doc-file-input"
                />
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Attached Verification Documents ({supportingDocuments.length})
                </label>

                {supportingDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {supportingDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 shrink-0">
                            {doc.mimeType?.includes('pdf') ? <File className="w-4 h-4 text-emerald-800" /> : <ImageIcon className="w-4 h-4 text-emerald-800" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{doc.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-bold text-emerald-800">{doc.type}</span>
                              <span>•</span>
                              <span>{doc.sizeBytes ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB` : 'Attached'}</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <Lock className="w-2.5 h-2.5" /> Private
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Remove Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs italic">
                    No verification documents attached yet. Please upload at least one verification document to submit.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: CAUSE GALLERY */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">5. Cause Photo Gallery</h3>
                <p className="text-xs text-slate-500">Upload additional photos of the cause, institution, or project for the public photo slider.</p>
              </div>

              <div 
                onClick={() => galleryFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer space-y-2"
                id="upload-cause-photos-btn"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {galleryUploading ? `Uploading Photos... ${galleryUploadProgress}%` : 'Upload Cause Photos'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Select multiple images (JPG, PNG, WebP up to 10MB each)</p>
                </div>

                {galleryUploading && (
                  <div className="w-48 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-600 h-full transition-all" style={{ width: `${galleryUploadProgress}%` }} />
                  </div>
                )}
              </div>

              <input 
                type="file" 
                multiple 
                ref={galleryFileInputRef} 
                onChange={handleGalleryFilesSelect} 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
                id="gallery-file-input"
              />

              {/* Gallery Grid */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Uploaded Gallery Photos ({supportingImages.length})
                </label>

                {supportingImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {supportingImages.map((img, idx) => (
                      <div key={img.id} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 shadow-xs">
                        <div className="relative h-32 rounded-xl overflow-hidden bg-slate-900">
                          <img 
                            src={img.url} 
                            alt={`Gallery ${idx + 1}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(img.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Photo caption (e.g. Student campus id)..."
                          value={img.caption || ''}
                          onChange={(e) => handleUpdateGalleryCaption(img.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 rounded-lg border border-slate-200 focus:bg-white"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No additional gallery photos uploaded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: APPEAL CREATOR DETAILS */}
          {/* ========================================================================= */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">6. Appeal Creator Profile & Parentage</h3>
                <p className="text-xs text-slate-500">Provide official identity and contact details of the person submitting this case.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <p>
                  <strong>Separation of Identities:</strong> The appeal creator details are recorded for verification accountability. Beneficiary details remain separate.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Creator Full Legal Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={creatorFullName}
                    onChange={(e) => setCreatorFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    id="creator-fullname-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Parentage / Father's or Guardian's Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S/o or D/o Late Syed Murtaza Hussain"
                    value={creatorParentage}
                    onChange={(e) => setCreatorParentage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    id="creator-parentage-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Primary Phone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={creatorContactPhone}
                    onChange={(e) => setCreatorContactPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    id="creator-phone-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Alternate / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9123456780"
                    value={creatorAlternatePhone}
                    onChange={(e) => setCreatorAlternatePhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={creatorEmailAddress}
                    onChange={(e) => setCreatorEmailAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    id="creator-email-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Relationship to Beneficiary <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={relationshipToBeneficiary}
                    onChange={(e) => setRelationshipToBeneficiary(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                    id="relationship-select"
                  >
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    FET Member / User ID (If applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FET-MEM-2026-0042"
                    value={creatorMemberId}
                    onChange={(e) => setCreatorMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Residential Location (House No., Street, City/Town/Village) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. House 4-1-88, Malakpet, Hyderabad, Telangana - 500036"
                  value={creatorResidentialLocation}
                  onChange={(e) => setCreatorResidentialLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  id="creator-address-input"
                />
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 7: DECLARATION */}
          {/* ========================================================================= */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">7. Institutional Undertaking & Declarations</h3>
                <p className="text-xs text-slate-500">Please review and affirm the institutional compliance principles before submitting.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={truthDeclaration}
                    onChange={(e) => setTruthDeclaration(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    id="decl-truth"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5">Truthfulness & Factual Accuracy Undertaking</strong>
                    I solemnly declare that all information, beneficiary circumstances, and attached verification documents submitted with this appeal are genuine, authentic, and accurate to the best of my knowledge.
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={trustDisbursalDeclaration}
                    onChange={(e) => setTrustDisbursalDeclaration(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    id="decl-disbursal"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5">Direct Institutional Disbursal Policy</strong>
                    I understand that Fatimyah Educational Trust disburses verified crowdfunding contributions directly to official institutional bank accounts (e.g. College/University or Hospital) to ensure 100% transparency.
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    id="decl-terms"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5">FET India Crowdfunding Guidelines & Terms of Service</strong>
                    I agree to the terms of service and acknowledge that all appeals are subject to verification scrutiny and approval by the Trust Board before going live publicly.
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 8: REVIEW & SUBMIT */}
          {/* ========================================================================= */}
          {currentStep === 8 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ready for Board Verification</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">Review Appeal Details</h3>
                <p className="text-xs text-slate-500">Please review all parameters before final submission to the Trust Secretariat.</p>
              </div>

              {/* Summary Card 1: Appeal & Cover */}
              <div className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-50">
                <div className="relative h-44 sm:h-52 bg-slate-900">
                  {coverImageUrl ? (
                    <img 
                      src={coverImageUrl} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800/80">
                      <HeartHandshake className="w-10 h-10 text-slate-500 mb-1.5" />
                      <span className="text-xs font-bold text-slate-400">Institutional Appeal Banner (No Photo Attached)</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-700 text-white">
                        {CAMPAIGN_CATEGORY_CONFIG[category]?.label}
                      </span>
                      <h4 className="text-base font-black mt-1 text-white">{title}</h4>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Case Narrative</span>
                    <p className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Goal</span>
                      <p className="font-black text-emerald-800 text-sm mt-0.5">{formatINR(Number(targetAmount) || 0)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Timeline Window</span>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">{startDate} to {endDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">{city || district}, {state}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Status on Submit</span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 mt-0.5">
                        Pending Review
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card 2: Beneficiary Details */}
              <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-200 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-800" />
                  <h4 className="font-black text-blue-950 text-sm">Beneficiary Details</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Beneficiary Name</span>
                    <p className="font-black text-slate-900">{beneficiaryName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Target Institution</span>
                    <p className="font-bold text-slate-900">{targetInstitution || 'Direct Educational Disbursal'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold block">Beneficiary Circumstance</span>
                    <p className="text-slate-700 leading-relaxed">{beneficiaryDescription}</p>
                  </div>
                </div>
              </div>

              {/* Summary Card 3: Verification Documents (PRIVATE) */}
              <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-800" />
                    <h4 className="font-black text-emerald-950 text-sm">Attached Private Verification Documents ({supportingDocuments.length})</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-950">
                    Confidential & Private
                  </span>
                </div>

                <div className="space-y-1.5">
                  {supportingDocuments.map((doc, idx) => (
                    <div key={doc.id || idx} className="p-2.5 rounded-xl bg-white border border-emerald-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{doc.name}</p>
                        <span className="text-[10px] text-slate-500">{doc.type}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800">Verified for Review</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card 4: Appeal Creator Profile */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-800" />
                  <h4 className="font-black text-slate-900 text-sm">Appeal Creator Profile</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Creator Legal Name</span>
                    <p className="font-black text-slate-900">{creatorFullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Parentage</span>
                    <p className="font-bold text-slate-900">{creatorParentage}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Relationship</span>
                    <p className="font-bold text-emerald-800">{relationshipToBeneficiary}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Contact Phone</span>
                    <p className="font-bold text-slate-900">{creatorContactPhone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">WhatsApp Number</span>
                    <p className="font-bold text-slate-900">{creatorAlternatePhone || creatorContactPhone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Email</span>
                    <p className="font-bold text-slate-900">{creatorEmailAddress}</p>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[10px] text-slate-400 font-bold block">Residential Address</span>
                    <p className="font-bold text-slate-900">{creatorResidentialLocation}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Action Controls Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 z-20 rounded-b-3xl">
          <div className="flex items-center gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {/* Save as Draft Button */}
            <button
              type="button"
              disabled={savingDraft || !title.trim()}
              onClick={handleSaveDraft}
              className="py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save progress as draft (does not submit for public review yet)"
              id="save-appeal-draft-btn"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>
          </div>

          {currentStep < 8 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-1.5"
              id="next-step-btn"
            >
              <span>Next: {stepsList[currentStep]?.label}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="py-3 px-8 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black transition-all shadow-xl active:scale-98 cursor-pointer flex items-center gap-2"
              id="submit-appeal-final-btn"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>{submitting ? 'Submitting Appeal for Review...' : 'Submit Appeal for Board Review'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
