/**
 * @license
 * Official Donate Now, Islamic Obligations, Land/Property & Material Portal
 * Fatimyah Educational Trust India (FET India)
 * Legal Name: Fatimyah Educational Trust
 * Regd. in Jammu & Kashmir through SDM Office (1994) • DARPAN: JK/2026/1153821 • PAN: AABTF0015H
 * 
 * 6 Core Donation Streams:
 * 1. Zakat (with interactive Shariah calculator, monetary via Razorpay, 80G receipt)
 * 2. Fitrah (with family per-capita aid calculator, monetary via Razorpay, 80G receipt)
 * 3. General Donation / Sadaqah (monetary via Razorpay, 80G receipt)
 * 4. Land / Property Donation (non-cash enquiry/submission workflow, BYPASSES Razorpay)
 * 5. Material Donation (non-cash in-kind workflow for sand, bricks, books, furniture, BYPASSES Razorpay)
 * 6. Other Contribution (non-cash specialized services, equipment, proposals, BYPASSES Razorpay)
 */

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Package, 
  Calculator, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Printer, 
  ArrowRight, 
  Lock, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  HelpCircle,
  Clock,
  Coins,
  BookOpen,
  Laptop,
  Check,
  Copy,
  Info,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { db, cleanFirestoreData } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initiateRazorpayContribution, CreateOrderParams, PaymentVerificationResult } from '../../lib/razorpay';
import { PrintableDonationReceiptModal } from '../donor/PrintableDonationReceiptModal';
import { DonationMediaSlider } from './DonationMediaSlider';

export type DonationTab = 
  | 'general' 
  | 'zakat' 
  | 'fitrah' 
  | 'property' 
  | 'material' 
  | 'other'
  | 'islamic' 
  | 'calculator';

export type GeneralCauseCategory = 
  | 'education_support' 
  | 'medical_relief' 
  | 'orphan_widow' 
  | 'food_ration' 
  | 'infrastructure'
  | 'general_fund';

export type PropertyType = 
  | 'residential_plot'
  | 'commercial_land'
  | 'agricultural_land'
  | 'built_building'
  | 'office_classroom_space'
  | 'waqf_deed_endowment'
  | 'other';

export type MaterialCategory = 
  | 'construction_materials'
  | 'educational_materials' 
  | 'laptops_computers_tablets' 
  | 'furniture_fixtures' 
  | 'medical_assistive_devices' 
  | 'ration_food_grains' 
  | 'other_useful_supplies';

export type OtherContributionType =
  | 'professional_services'
  | 'medical_machinery'
  | 'vehicle_ambulance'
  | 'digital_cloud_infrastructure'
  | 'teaching_mentorship'
  | 'corporate_csr'
  | 'other_humanitarian';

interface GeneralDonationViewProps {
  initialTab?: DonationTab;
  onClose?: () => void;
  onOpenAuth?: () => void;
  isFullPage?: boolean;
}

export const GeneralDonationView: React.FC<GeneralDonationViewProps> = ({
  initialTab = 'general',
  onClose,
  onOpenAuth,
  isFullPage = false
}) => {
  const { currentUser, userProfile } = useAuth();
  const { config } = useConfig();

  // Normalize initialTab
  const normalizeTab = (tab: DonationTab): DonationTab => {
    if (tab === 'islamic') return 'zakat';
    if (tab === 'calculator') return 'zakat';
    return tab;
  };

  const [activeTab, setActiveTab] = useState<DonationTab>(normalizeTab(initialTab));

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  // General & Islamic Monetary State
  const [selectedCause, setSelectedCause] = useState<GeneralCauseCategory>('education_support');
  const [donationFrequency, setDonationFrequency] = useState<'one_time' | 'monthly'>('one_time');
  const [customAmount, setCustomAmount] = useState<string>('2500');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Donor Contact Info
  const [donorName, setDonorName] = useState<string>(
    userProfile?.fullLegalName || userProfile?.fullName || currentUser?.displayName || ''
  );
  const [donorEmail, setDonorEmail] = useState<string>(
    userProfile?.email || currentUser?.email || ''
  );
  const [donorPhone, setDonorPhone] = useState<string>(
    userProfile?.mobileNumber || userProfile?.phoneNumber || ''
  );
  const [donorPan, setDonorPan] = useState<string>(userProfile?.panNumber || '');
  const [donorAddress, setDonorAddress] = useState<string>(userProfile?.address || '');

  // Zakat Calculator State
  const [showZakatCalculator, setShowZakatCalculator] = useState<boolean>(initialTab === 'calculator');
  const [calcGoldValue, setCalcGoldValue] = useState<number>(0);
  const [calcSilverValue, setCalcSilverValue] = useState<number>(0);
  const [calcCashBank, setCalcCashBank] = useState<number>(100000);
  const [calcBusinessStock, setCalcBusinessStock] = useState<number>(0);
  const [calcLiabilities, setCalcLiabilities] = useState<number>(0);

  // Fitrah Aid Calculator State
  const [fitrahFamilyCount, setFitrahFamilyCount] = useState<number>(4);
  const [fitrahRatePerPerson, setFitrahRatePerPerson] = useState<number>(250);

  // Land / Property State (Non-Cash - Bypasses Razorpay)
  const [propertyType, setPropertyType] = useState<PropertyType>('residential_plot');
  const [propertyArea, setPropertyArea] = useState<string>('2,500 sq.ft.');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [propertyCity, setPropertyCity] = useState<string>(userProfile?.city || 'Mumbai');
  const [propertyState, setPropertyState] = useState<string>(userProfile?.state || 'Maharashtra');
  const [propertyPincode, setPropertyPincode] = useState<string>('');
  const [propertyEncumbrance, setPropertyEncumbrance] = useState<'clear_title' | 'family_ancestral' | 'under_verification'>('clear_title');
  const [intendedPurpose, setIntendedPurpose] = useState<string>('school_education');
  const [propertyNotes, setPropertyNotes] = useState<string>('');
  const [propertyTicket, setPropertyTicket] = useState<any | null>(null);

  // Material / In-Kind Form State (Non-Cash - Bypasses Razorpay)
  const [materialCategory, setMaterialCategory] = useState<MaterialCategory>('construction_materials');
  const [materialCondition, setMaterialCondition] = useState<'new' | 'gently_used' | 'functional'>('new');
  const [materialQuantity, setMaterialQuantity] = useState<string>('10 Units / Tons');
  const [materialDescription, setMaterialDescription] = useState<string>('');
  const [logisticsPreference, setLogisticsPreference] = useState<'donor_ship' | 'drop_off' | 'request_pickup'>('donor_ship');
  const [materialCity, setMaterialCity] = useState<string>(userProfile?.city || 'Mumbai');
  const [materialState, setMaterialState] = useState<string>(userProfile?.state || 'Maharashtra');
  const [materialPincode, setMaterialPincode] = useState<string>((userProfile as any)?.postalCode || (userProfile as any)?.pincode || '');
  const [materialTicket, setMaterialTicket] = useState<any | null>(null);

  // Other Contribution State (Non-Cash - Bypasses Razorpay)
  const [otherType, setOtherType] = useState<OtherContributionType>('professional_services');
  const [otherDescription, setOtherDescription] = useState<string>('');
  const [otherCapacity, setOtherCapacity] = useState<string>('Ongoing / Flexible');
  const [otherTicket, setOtherTicket] = useState<any | null>(null);

  // Processing & Feedback State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successReceiptData, setSuccessReceiptData] = useState<any | null>(null);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Suggested amount presets
  const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

  // Calculate Net Zakat Payable (2.5% of net liquid wealth)
  const netZakatBase = Math.max(0, (calcGoldValue + calcSilverValue + calcCashBank + calcBusinessStock) - calcLiabilities);
  const calculatedZakatPayable = Math.round(netZakatBase * 0.025);

  // Calculate Fitrah total
  const calculatedFitrahTotal = fitrahFamilyCount * fitrahRatePerPerson;

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(fieldName);
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  // -------------------------------------------------------------
  // HANDLER: MONETARY PAYMENT VIA RAZORPAY (General, Zakat, Fitrah)
  // -------------------------------------------------------------
  const handleProceedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    const amountNum = parseFloat(customAmount);
    if (isNaN(amountNum) || amountNum < 1) {
      setErrorNotice('Please specify a valid contribution amount (minimum ₹1).');
      return;
    }

    if (!donorName.trim()) {
      setErrorNotice('Full legal name is required for formal Section 80G tax receipt issuance.');
      return;
    }

    if (!donorEmail.trim()) {
      setErrorNotice('Email address is required to receive your Section 80G certificate.');
      return;
    }

    setIsProcessing(true);

    let campaignTitleLabel = 'General Endowment';
    let streamType = 'general';
    let notesText = `Allocated to ${selectedCause.replace('_', ' ')} under the charitable charter of Fatimyah Educational Trust.`;

    if (activeTab === 'zakat') {
      campaignTitleLabel = 'Zakat Fund Disbursement';
      streamType = 'zakat';
      notesText = 'Designated specifically for Zakat disbursement strictly adhering to Islamic guidelines.';
    } else if (activeTab === 'fitrah') {
      campaignTitleLabel = 'Fitrah & Eid Relief Aid';
      streamType = 'fitrah';
      notesText = `Designated for Fitrah & Eid food sustenance for ${fitrahFamilyCount} family members.`;
    }

    const orderParams: CreateOrderParams = {
      amount: amountNum,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone.trim() || undefined,
      donorPan: donorPan.trim() || undefined,
      campaignId: `donation_${streamType}_${Date.now()}`,
      campaignTitle: campaignTitleLabel,
      donorUid: currentUser?.uid,
      isAnonymous: isAnonymous
    };

    try {
      await initiateRazorpayContribution({
        orderParams,
        preferredMethod: 'all',
        onSuccess: async (res: PaymentVerificationResult) => {
          setIsProcessing(false);
          const generatedReceipt = {
            receiptNumber: res.receiptNumber || `FET-REC-${Date.now()}`,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            donorName: donorName.trim(),
            donorPan: donorPan.trim() || 'NOT_SPECIFIED',
            donorAddress: donorAddress.trim() || 'India',
            amount: amountNum,
            campaignTitle: campaignTitleLabel,
            paymentMode: 'Online (Razorpay / UPI / NetBanking)',
            transactionId: res.paymentId || res.internalReference || 'TXN-ONLINE',
            isAnonymous: isAnonymous,
            notes: notesText
          };

          // Save transaction to Firestore
          try {
            await addDoc(collection(db, 'donations'), cleanFirestoreData({
              ...generatedReceipt,
              donorUid: currentUser?.uid || null,
              donorEmail: donorEmail.trim(),
              donorPhone: donorPhone.trim(),
              category: streamType,
              subType: streamType === 'general' ? selectedCause : streamType,
              status: 'successful',
              createdAt: serverTimestamp()
            }));
          } catch (dbErr) {
            console.warn('Firestore donation log fallback:', dbErr);
          }

          setSuccessReceiptData(generatedReceipt);
        },
        onError: (errMsg: string) => {
          setIsProcessing(false);
          setErrorNotice(errMsg);
        },
        onDismiss: () => {
          setIsProcessing(false);
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      setErrorNotice(err?.message || 'Payment initiation encountered an unexpected error.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER: LAND / PROPERTY SUBMISSION (NON-CASH - BYPASSES RAZORPAY)
  // -------------------------------------------------------------
  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!donorName.trim() || !donorPhone.trim()) {
      setErrorNotice('Donor/Owner legal name and phone number are required for legal verification.');
      return;
    }

    if (!propertyAddress.trim() || !propertyCity.trim()) {
      setErrorNotice('Property location address and city are required.');
      return;
    }

    setIsProcessing(true);

    const trackingRef = `FET-PROP-${Math.floor(100000 + Math.random() * 900000)}`;

    const proposalData = {
      trackingRef,
      donorUid: currentUser?.uid || null,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone.trim(),
      propertyType,
      propertyArea: propertyArea.trim(),
      propertyAddress: propertyAddress.trim(),
      city: propertyCity.trim(),
      state: propertyState.trim(),
      pincode: propertyPincode.trim(),
      encumbranceStatus: propertyEncumbrance,
      intendedPurpose,
      notes: propertyNotes.trim(),
      status: 'pending_legal_review',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'property_donations'), cleanFirestoreData(proposalData));
      
      await addDoc(collection(db, 'admin_notifications'), cleanFirestoreData({
        title: `New Land/Property Proposal: ${trackingRef}`,
        message: `${donorName} offered ${propertyArea} of ${propertyType.replace('_', ' ')} in ${propertyCity}.`,
        type: 'property_donation',
        createdAt: new Date().toISOString()
      })).catch(() => {});

      setPropertyTicket(proposalData);
    } catch (err: any) {
      console.warn('Property proposal saved locally:', err);
      // Even if Firestore fails, show ticket to donor
      setPropertyTicket(proposalData);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: MATERIAL DONATION SUBMISSION (NON-CASH - BYPASSES RAZORPAY)
  // -------------------------------------------------------------
  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!donorName.trim() || !donorPhone.trim()) {
      setErrorNotice('Name and contact phone number are required for logistics coordination.');
      return;
    }

    if (!materialDescription.trim()) {
      setErrorNotice('Please provide a description of the materials you wish to contribute (e.g. sand, bricks, books, furniture, etc.).');
      return;
    }

    setIsProcessing(true);

    const trackingRef = `FET-MAT-${Math.floor(100000 + Math.random() * 900000)}`;

    const materialProposal = {
      trackingRef,
      donorUid: currentUser?.uid || null,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone.trim(),
      city: materialCity.trim(),
      state: materialState.trim(),
      pincode: materialPincode.trim(),
      category: materialCategory,
      condition: materialCondition,
      quantity: materialQuantity.trim(),
      description: materialDescription.trim(),
      logisticsPreference,
      status: 'pending_logistics_review',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'material_donations'), cleanFirestoreData(materialProposal));

      await addDoc(collection(db, 'admin_notifications'), cleanFirestoreData({
        title: `New Material Donation: ${trackingRef}`,
        message: `${donorName} offered ${materialQuantity} (${materialCategory}) from ${materialCity}.`,
        type: 'material_donation',
        createdAt: new Date().toISOString()
      })).catch(() => {});

      setMaterialTicket(materialProposal);
    } catch (err: any) {
      console.warn('Material proposal fallback:', err);
      setMaterialTicket(materialProposal);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: OTHER CONTRIBUTION SUBMISSION (NON-CASH - BYPASSES RAZORPAY)
  // -------------------------------------------------------------
  const handleSubmitOther = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!donorName.trim() || !donorPhone.trim()) {
      setErrorNotice('Your name and phone number are required.');
      return;
    }

    if (!otherDescription.trim()) {
      setErrorNotice('Please describe the proposed contribution, service, or equipment in detail.');
      return;
    }

    setIsProcessing(true);

    const trackingRef = `FET-OTH-${Math.floor(100000 + Math.random() * 900000)}`;

    const otherProposal = {
      trackingRef,
      donorUid: currentUser?.uid || null,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone.trim(),
      city: donorAddress.trim() || 'India',
      contributionType: otherType,
      description: otherDescription.trim(),
      capacityTimeline: otherCapacity.trim(),
      status: 'pending_secretariat_review',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'other_contributions'), cleanFirestoreData(otherProposal));

      await addDoc(collection(db, 'admin_notifications'), cleanFirestoreData({
        title: `New Special Contribution: ${trackingRef}`,
        message: `${donorName} proposed ${otherType.replace('_', ' ')}.`,
        type: 'other_contribution',
        createdAt: new Date().toISOString()
      })).catch(() => {});

      setOtherTicket(otherProposal);
    } catch (err: any) {
      console.warn('Other proposal fallback:', err);
      setOtherTicket(otherProposal);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`bg-slate-100/60 ${isFullPage ? 'min-h-[calc(100vh-160px)] py-4 sm:py-8' : 'min-h-screen py-6 sm:py-10'} px-3 sm:px-6 lg:px-8`} id="donate-now-page-root">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Full-Page Breadcrumb Navigation */}
        {isFullPage && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button 
              type="button"
              onClick={onClose}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">Donate Now (80G Tax Exemption)</span>
          </nav>
        )}

        {/* ========================================================================= */}
        {/* 1. DONATION PAGE HERO MEDIA SLIDER                                        */}
        {/* ========================================================================= */}
        <div className="relative">
          <DonationMediaSlider />

          {!isFullPage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-colors cursor-pointer border border-white/20 shadow-lg"
              title="Close Portal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. STATUTORY TRUST HEADER & TABS CONTROLLER                               */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-800" />
                <span>FATIMYAH EDUCATIONAL TRUST</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif tracking-tight mt-1.5">
                Official Support & Charitable Giving Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Empowering communities through education, emergency healthcare, and grassroots welfare.
                Monetary contributions are eligible for 50% Section 80G Tax Exemption.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 shrink-0 text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                STATUTORY ACCREDITATION
              </span>
              <span className="text-base font-black text-slate-950 block">
                50% TAX RELIEF (80G)
              </span>
              <span className="text-[10px] font-mono text-slate-600 block">
                DARPAN: {config.nitiAayogId || 'JK/2026/1153821'} • PAN: {config.panNumber || 'AABTF0015H'}
              </span>
            </div>
          </div>

          {/* 6 MAIN STREAM NAVIGATION TABS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            
            {/* 1. General Donation / Sadaqah */}
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 ${
                activeTab === 'general'
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <HeartHandshake className={`w-5 h-5 ${activeTab === 'general' ? 'text-amber-400' : 'text-emerald-700'}`} />
              <div>
                <div className="text-xs font-black leading-tight">General / Sadaqah</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'general' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  Monetary • 80G
                </div>
              </div>
            </button>

            {/* 2. Zakat */}
            <button
              type="button"
              onClick={() => setActiveTab('zakat')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 ${
                activeTab === 'zakat'
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Coins className={`w-5 h-5 ${activeTab === 'zakat' ? 'text-amber-400' : 'text-amber-600'}`} />
              <div>
                <div className="text-xs font-black leading-tight">Zakat Fund</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'zakat' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  2.5% • Calculator
                </div>
              </div>
            </button>

            {/* 3. Fitrah */}
            <button
              type="button"
              onClick={() => setActiveTab('fitrah')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 ${
                activeTab === 'fitrah'
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${activeTab === 'fitrah' ? 'text-amber-400' : 'text-teal-600'}`} />
              <div>
                <div className="text-xs font-black leading-tight">Fitrah (Eid Aid)</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'fitrah' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  Per-Capita Food Aid
                </div>
              </div>
            </button>

            {/* 4. Land / Property (Non-Cash) */}
            <button
              type="button"
              onClick={() => setActiveTab('property')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 ${
                activeTab === 'property'
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Building2 className={`w-5 h-5 ${activeTab === 'property' ? 'text-amber-400' : 'text-indigo-600'}`} />
              <div>
                <div className="text-xs font-black leading-tight">Land / Property</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'property' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  Non-Cash Enquiry
                </div>
              </div>
            </button>

            {/* 5. Material Donation (Non-Cash) */}
            <button
              type="button"
              onClick={() => setActiveTab('material')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 ${
                activeTab === 'material'
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Package className={`w-5 h-5 ${activeTab === 'material' ? 'text-amber-400' : 'text-amber-700'}`} />
              <div>
                <div className="text-xs font-black leading-tight">Material Giving</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'material' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  In-Kind (Bricks, Sand)
                </div>
              </div>
            </button>

            {/* 6. Other Contribution (Non-Cash) */}
            <button
              type="button"
              onClick={() => setActiveTab('other')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 ${
                activeTab === 'other'
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Layers className={`w-5 h-5 ${activeTab === 'other' ? 'text-amber-400' : 'text-purple-600'}`} />
              <div>
                <div className="text-xs font-black leading-tight">Other Contribution</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'other' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  Services / Equipment
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* Error Alert */}
        {errorNotice && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">{errorNotice}</div>
            <button 
              type="button" 
              onClick={() => setErrorNotice(null)}
              className="text-rose-500 hover:text-rose-800 font-bold cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: GENERAL DONATION / SADAQAH (MONETARY VIA RAZORPAY)                 */}
        {/* ========================================================================= */}
        {activeTab === 'general' && (
          <form onSubmit={handleProceedPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Cause Selection & Amount */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Charitable Cause Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">1. Select Charitable Allocation</h3>
                  <p className="text-xs text-slate-500">
                    Choose which humanitarian pillar your voluntary contribution should support.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { id: 'education_support', label: 'Student Scholarships & Tuition', desc: 'Direct school fees, uniforms & textbooks' },
                    { id: 'medical_relief', label: 'Emergency Medical & Healthcare', desc: 'Hospitalizations, surgeries, dialysis' },
                    { id: 'orphan_widow', label: 'Orphan & Widow Sustenance', desc: 'Monthly living aid & dignity stipends' },
                    { id: 'food_ration', label: 'Food Rations & Nutrition Kits', desc: 'Essential grocery parcels for destitute families' },
                    { id: 'infrastructure', label: 'School Building & Digital Labs', desc: 'Permanent classrooms, libraries & STEM labs' },
                    { id: 'general_fund', label: 'General Trust Discretionary Fund', desc: 'Allocated wherever urgency is highest' }
                  ].map((cause) => (
                    <button
                      key={cause.id}
                      type="button"
                      onClick={() => setSelectedCause(cause.id as GeneralCauseCategory)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        selectedCause === cause.id
                          ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{cause.label}</span>
                        {selectedCause === cause.id && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">{cause.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">2. Contribution Amount</h3>
                    <p className="text-xs text-slate-500">Qualifies for 50% deduction under Section 80G.</p>
                  </div>

                  {/* Frequency Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDonationFrequency('one_time')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        donationFrequency === 'one_time' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      One-Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationFrequency('monthly')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        donationFrequency === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomAmount(amt.toString())}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        customAmount === amt.toString()
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-300 font-black text-slate-900 text-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

            </div>

            {/* Right 1 Col: Donor Details & Checkout */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">3. Donor Verification & 80G Receipt</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g. Aslam Khan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="receipt@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Mobile Number (WhatsApp Receipt)</label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      PAN Number <span className="text-emerald-700 font-normal">(Required for 80G Form 10BE)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={donorPan}
                      onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Postal Address</label>
                    <input
                      type="text"
                      value={donorAddress}
                      onChange={(e) => setDonorAddress(e.target.value)}
                      placeholder="City, State, Pincode"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      Keep my name confidential on public donor rolls
                    </span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4 text-emerald-300" />
                    <span>
                      {isProcessing ? 'Connecting Gateway...' : `Proceed ₹${parseFloat(customAmount || '0').toLocaleString('en-IN')}`}
                    </span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Razorpay 256-bit Encrypted • UPI, Cards & NetBanking</span>
                  </div>
                </div>
              </div>
            </div>

          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ZAKAT FUND (WITH BUILT-IN SHARIAH CALCULATOR & RAZORPAY)           */}
        {/* ========================================================================= */}
        {activeTab === 'zakat' && (
          <div className="space-y-6">
            
            {/* Zakat Calculator Toggle Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    <Coins className="w-3 h-3 text-amber-700" />
                    <span>SHARIAH COMPLIANT 2.5% WEALTH PURIFICATION</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 font-serif mt-1">
                    Calculate & Fulfill Your Annual Zakat
                  </h3>
                  <p className="text-xs text-slate-500">
                    100% of Zakat proceeds are disbursed to verified eligible beneficiaries (Mustahiqeen) for education and emergency healthcare.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowZakatCalculator(!showZakatCalculator)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{showZakatCalculator ? 'Hide Calculator' : 'Open Zakat Calculator'}</span>
                </button>
              </div>

              {/* Calculator Sheet */}
              {showZakatCalculator && (
                <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200 space-y-4 mt-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Cash & Bank Accounts (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={calcCashBank}
                        onChange={(e) => setCalcCashBank(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Gold & Jewelry (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={calcGoldValue}
                        onChange={(e) => setCalcGoldValue(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Silver Value (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={calcSilverValue}
                        onChange={(e) => setCalcSilverValue(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Trade Goods / Business Stock (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={calcBusinessStock}
                        onChange={(e) => setCalcBusinessStock(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-rose-700 block mb-1">Less: Immediate Debts & Outstanding Liabilities (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={calcLiabilities}
                      onChange={(e) => setCalcLiabilities(Number(e.target.value) || 0)}
                      className="w-full max-w-md px-3 py-2 bg-white rounded-xl border border-rose-300 text-xs font-semibold"
                    />
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-800">Net Calculated Zakat (2.5%)</div>
                      <div className="text-2xl font-black text-slate-900 font-serif">
                        ₹{calculatedZakatPayable.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500">Across net wealth of ₹{netZakatBase.toLocaleString('en-IN')}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCustomAmount(calculatedZakatPayable.toString())}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs cursor-pointer"
                    >
                      Apply to Donation Amount
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Zakat Payment Form */}
            <form onSubmit={handleProceedPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-4">
                  <h3 className="text-base font-black text-slate-900">Zakat Amount & Preset</h3>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[2500, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomAmount(amt.toString())}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          customAmount === amt.toString()
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                      ₹
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter custom zakat amount"
                      className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-300 font-black text-slate-900 text-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Right Col: Details */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">Zakat Fulfiller Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Email (For 80G Receipt) *</label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Mobile (WhatsApp Receipt)</label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">PAN Number (For Form 10BE)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={donorPan}
                      onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Processing...' : `Fulfill Zakat (₹${parseFloat(customAmount || '0').toLocaleString('en-IN')})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FITRAH (EID PER-CAPITA AID VIA RAZORPAY)                           */}
        {/* ========================================================================= */}
        {activeTab === 'fitrah' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-950 border border-teal-300">
                  <Sparkles className="w-3 h-3 text-teal-700" />
                  <span>ZAKAT-UL-FITR (EID FOOD SECURITY ALLOCATION)</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 font-serif mt-1">
                  Fitrah Per-Capita Calculator & Fulfillment
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Fulfill your mandatory Zakat-ul-Fitr on behalf of yourself and all family members in your household.
                  FET India delivers dry food grain parcels to destitute families before Eid prayer.
                </p>
              </div>

              {/* Family Size Calculator Card */}
              <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Family Members</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 4, 6, 8].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setFitrahFamilyCount(count);
                          setCustomAmount((count * fitrahRatePerPerson).toString());
                        }}
                        className={`w-9 h-9 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                          fitrahFamilyCount === count ? 'bg-teal-800 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fitrah Rate per Person (₹)</label>
                  <select
                    value={fitrahRatePerPerson}
                    onChange={(e) => {
                      const newRate = Number(e.target.value);
                      setFitrahRatePerPerson(newRate);
                      setCustomAmount((fitrahFamilyCount * newRate).toString());
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                  >
                    <option value={150}>₹150 / Person (Standard Grain Equivalent)</option>
                    <option value={250}>₹250 / Person (Generous Food Parcel)</option>
                    <option value={500}>₹500 / Person (Premium Eid Feast Basket)</option>
                  </select>
                </div>

                <div className="bg-white rounded-xl p-3 border border-teal-300 text-center sm:text-right">
                  <div className="text-[10px] font-bold text-teal-800 uppercase">Calculated Fitrah Total</div>
                  <div className="text-2xl font-black text-slate-900 font-serif">
                    ₹{calculatedFitrahTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Fitrah Payment Form */}
            <form onSubmit={handleProceedPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-3">
                  <h3 className="text-sm font-black text-slate-900">Total Fitrah Contribution Amount</h3>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                      ₹
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-300 font-black text-slate-900 text-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-3">
                <h3 className="text-sm font-black text-slate-900">Contact & 80G Receipt</h3>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={donorPan}
                    onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {isProcessing ? 'Processing...' : `Disburse Fitrah (₹${parseFloat(customAmount || '0').toLocaleString('en-IN')})`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LAND / PROPERTY DONATION (NON-CASH - BYPASSES RAZORPAY)            */}
        {/* ========================================================================= */}
        {activeTab === 'property' && (
          <div className="space-y-6">
            
            {/* If proposal already submitted, show official acknowledgment card */}
            {propertyTicket ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-600 shadow-lg space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950">
                      ENQUIRY CONFIRMATION REFERENCE
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                      Land & Property Donation Proposal Registered
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Official reference tracking ticket generated. Our Legal & Land Acquisition Committee will contact you directly.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Tracking Reference</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">{propertyTicket.trackingRef}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Property Type</span>
                    <span className="font-bold text-slate-900 capitalize">{propertyTicket.propertyType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Area / Dimensions</span>
                    <span className="font-bold text-slate-900">{propertyTicket.propertyArea}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Location</span>
                    <span className="font-semibold text-slate-800">{propertyTicket.propertyAddress}, {propertyTicket.city}, {propertyTicket.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Donor / Custodian</span>
                    <span className="font-bold text-slate-900">{propertyTicket.donorName} ({propertyTicket.donorPhone})</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Next Steps:</strong> The Fatimyah Educational Trust Legal Secretariat will reach out to you within 48 hours to inspect deed copies, site plan coordinates, and initiate mutual registration or Waqf-al-Aulad documentation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Acknowledgment Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPropertyTicket(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                  >
                    Submit Another Property Enquiry
                  </button>
                </div>
              </div>
            ) : (
              /* Land/Property Submission Form */
              <form onSubmit={handleSubmitProperty} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-950 border border-indigo-300">
                    <Building2 className="w-3 h-3 text-indigo-700" />
                    <span>REAL ESTATE & WAQF ENDOWMENT (NON-CASH)</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 font-serif">
                    Endow Land, Building, or Property for Educational & Charitable Use
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fatimyah Educational Trust develops modern schools, computer academies, diagnostic clinics, and orphanages on donated lands across India. Non-cash contributions bypass payment gateways.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Property Category *</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="residential_plot">Residential / NA Plot</option>
                      <option value="commercial_land">Commercial Plot / Land</option>
                      <option value="agricultural_land">Agricultural Land</option>
                      <option value="built_building">Constructed Building / Complex</option>
                      <option value="office_classroom_space">Commercial Office / Classroom Premises</option>
                      <option value="waqf_deed_endowment">Waqf / Trust Deed Endowment</option>
                      <option value="other">Other Real Estate Asset</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Estimated Area / Dimensions *</label>
                    <input
                      type="text"
                      required
                      value={propertyArea}
                      onChange={(e) => setPropertyArea(e.target.value)}
                      placeholder="e.g. 5,000 sq.ft. / 1 Acre / 2 Bigha"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Encumbrance & Title Status *</label>
                    <select
                      value={propertyEncumbrance}
                      onChange={(e) => setPropertyEncumbrance(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="clear_title">Clear Title & Freehold (Single Owner)</option>
                      <option value="family_ancestral">Family / Ancestral (All consents available)</option>
                      <option value="under_verification">Documentation In Progress</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Property Location Address *</label>
                    <input
                      type="text"
                      required
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      placeholder="Survey No., Street, Landmark, Area"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">City / Taluka *</label>
                    <input
                      type="text"
                      required
                      value={propertyCity}
                      onChange={(e) => setPropertyCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={propertyState}
                      onChange={(e) => setPropertyState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={propertyPincode}
                      onChange={(e) => setPropertyPincode(e.target.value)}
                      placeholder="400001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Preferred Charitable Use</label>
                    <select
                      value={intendedPurpose}
                      onChange={(e) => setIntendedPurpose(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="school_education">School / College / STEM Academy</option>
                      <option value="health_clinic">Charitable Hospital / Diagnostic Clinic</option>
                      <option value="orphanage_hostel">Orphanage & Student Hostel</option>
                      <option value="community_center">Community Welfare Center</option>
                      <option value="trust_discretion">Trust Executive Discretion (Highest Need)</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Additional Details & Specific Instructions</label>
                    <textarea
                      rows={3}
                      value={propertyNotes}
                      onChange={(e) => setPropertyNotes(e.target.value)}
                      placeholder="Mention road access width, electricity/water availability, mutation status, or any personal donor wishes..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-xs font-black text-slate-900 mb-3">Owner / Contact Coordinates</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone Number (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Non-cash land donations bypass Razorpay. Official Trust registration process begins post legal verification.
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? 'Submitting Proposal...' : 'Submit Land / Property Enquiry'}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MATERIAL DONATION (NON-CASH - BYPASSES RAZORPAY)                   */}
        {/* ========================================================================= */}
        {activeTab === 'material' && (
          <div className="space-y-6">

            {materialTicket ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-600 shadow-lg space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950">
                      MATERIAL DONATION REFERENCE
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                      In-Kind Material Contribution Registered
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Thank you! Our Central Logistics & Material Inspection Team has received your details.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Tracking Reference</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">{materialTicket.trackingRef}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Category</span>
                    <span className="font-bold text-slate-900 capitalize">{materialTicket.category.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Quantity</span>
                    <span className="font-bold text-slate-900">{materialTicket.quantity}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Material Description</span>
                    <span className="font-semibold text-slate-800">{materialTicket.description}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Logistics Method</span>
                    <span className="font-bold text-slate-900 capitalize">{materialTicket.logisticsPreference.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print In-Kind Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaterialTicket(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                  >
                    Submit Another Material Item
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitMaterial} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300">
                    <Package className="w-3 h-3 text-amber-700" />
                    <span>IN-KIND & PHYSICAL GOODS (NON-CASH)</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 font-serif">
                    Contribute Physical Goods, Construction Materials, Books & Supplies
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You can contribute materials such as: <strong>sand</strong>, <strong>bricks</strong>, <strong>books</strong>, <strong>furniture</strong>, <strong>construction materials</strong>, <strong>educational materials</strong>, or <strong>other useful supplies</strong>. Describe your contribution below; our logistics team will coordinate handover.
                  </p>
                </div>

                {/* Example Quick Selector Pills */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-2">Material Stream</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'construction_materials', label: 'Construction Materials (Sand, Bricks, Cement)' },
                      { id: 'educational_materials', label: 'Educational Materials (Books, Notebooks, Kits)' },
                      { id: 'furniture_fixtures', label: 'Furniture (Benches, Desks, Chairs)' },
                      { id: 'laptops_computers_tablets', label: 'Digital Devices (Computers, Laptops)' },
                      { id: 'medical_assistive_devices', label: 'Medical Devices & First Aid' },
                      { id: 'ration_food_grains', label: 'Food Rations & Grains' },
                      { id: 'other_useful_supplies', label: 'Other Useful Materials' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMaterialCategory(cat.id as MaterialCategory)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          materialCategory === cat.id
                            ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Open Description Field */}
                <div>
                  <label className="text-xs font-bold text-slate-900 block mb-1">
                    Describe What You Want to Contribute *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    placeholder="Provide details of the items. Examples:
- 5 truckloads of river sand & 10,000 red bricks for ongoing classroom expansion
- 250 high school science and mathematics textbooks
- 40 wooden dual-desks and benches for classroom seating
- 15 refurbished laptops for student computer lab
- 50 bags of cement or tiles for flooring..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Estimated Quantity *</label>
                    <input
                      type="text"
                      required
                      value={materialQuantity}
                      onChange={(e) => setMaterialQuantity(e.target.value)}
                      placeholder="e.g. 5 Tons / 500 Bags / 20 Units"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Item Condition *</label>
                    <select
                      value={materialCondition}
                      onChange={(e) => setMaterialCondition(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="new">Brand New / Factory Sealed</option>
                      <option value="gently_used">Gently Used / Like New</option>
                      <option value="functional">Functional & Usable</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Logistics Preference *</label>
                    <select
                      value={logisticsPreference}
                      onChange={(e) => setLogisticsPreference(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="donor_ship">Donor Will Transport / Ship to Trust Hub</option>
                      <option value="drop_off">Donor Will Drop Off at Local Center</option>
                      <option value="request_pickup">Request Trust Volunteer Pickup</option>
                    </select>
                  </div>
                </div>

                {/* Donor Coordinates */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-xs font-black text-slate-900 mb-3">Donor & Handover Coordinates</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Donor Name *</label>
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">City / Location *</label>
                      <input
                        type="text"
                        required
                        value={materialCity}
                        onChange={(e) => setMaterialCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Non-cash material donations bypass payment gateways. You will receive an official Acknowledgment of Goods receipt.
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? 'Registering Proposal...' : 'Submit Material Donation Proposal'}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: OTHER CONTRIBUTION (NON-CASH - BYPASSES RAZORPAY)                  */}
        {/* ========================================================================= */}
        {activeTab === 'other' && (
          <div className="space-y-6">

            {otherTicket ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-purple-600 shadow-lg space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-950">
                      CONTRIBUTION PROPOSAL REFERENCE
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                      Specialized Contribution Proposal Received
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Thank you for offering your unique resources. Our Central Secretariat will review and connect with you.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Tracking Reference</span>
                    <span className="font-mono font-black text-purple-800 text-sm">{otherTicket.trackingRef}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Contribution Type</span>
                    <span className="font-bold text-slate-900 capitalize">{otherTicket.contributionType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Capacity / Timeline</span>
                    <span className="font-bold text-slate-900">{otherTicket.capacityTimeline}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Proposal Message</span>
                    <span className="font-semibold text-slate-800">{otherTicket.description}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Submission Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtherTicket(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                  >
                    Submit Another Proposal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitOther} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-950 border border-purple-300">
                    <Layers className="w-3 h-3 text-purple-700" />
                    <span>SPECIALIZED & INSTITUTIONAL PARTNERSHIP</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 font-serif">
                    Offer Professional Services, Machinery, Fleet or Custom Aid
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Have unique resources to support the Trust? Whether pro-bono legal/audit consultation, hospital diagnostic equipment, transport vehicles, or educational software, we welcome your support.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Contribution Nature *</label>
                    <select
                      value={otherType}
                      onChange={(e) => setOtherType(e.target.value as OtherContributionType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="professional_services">Pro-Bono Professional Services (Legal, Medical, Audit)</option>
                      <option value="medical_machinery">Medical Equipment & Diagnostic Machinery</option>
                      <option value="vehicle_ambulance">Vehicles / Ambulance / Transport Fleet</option>
                      <option value="digital_cloud_infrastructure">Digital Software / Cloud Services / Servers</option>
                      <option value="teaching_mentorship">Guest Lecturing & Academic Mentorship</option>
                      <option value="corporate_csr">Corporate CSR Grant / Institutional Partnership</option>
                      <option value="other_humanitarian">Other Unique Humanitarian Contribution</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Availability / Capacity Timeline</label>
                    <input
                      type="text"
                      value={otherCapacity}
                      onChange={(e) => setOtherCapacity(e.target.value)}
                      placeholder="e.g. 5 hours/week, Immediate delivery, Annual grant..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-900 block mb-1">
                    Describe Your Proposed Contribution & How It Can Assist FET India *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={otherDescription}
                    onChange={(e) => setOtherDescription(e.target.value)}
                    placeholder="Provide specifications, scope of assistance, machine model, or details of the services you wish to offer..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-xs font-black text-slate-900 mb-3">Representative Coordinates</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Name / Organization *</label>
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Non-cash contributions bypass payment gateways. You will receive an official acknowledgment and direct response.
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? 'Submitting...' : 'Submit Contribution Proposal'}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. DIRECT TRUST BANK TRANSFER & STATUTORY CREDENTIALS BOX                 */}
        {/* ========================================================================= */}
        {config.bankDetails?.isEnabled !== false && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6" id="fet-direct-bank-transfer-box">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>DIRECT NEFT / RTGS / IMPS / UPI TRANSFER</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 font-serif mt-0.5">
                  Official Trust Bank Account Coordinates
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Tax Exemption receipts issued for all direct bank transfers.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Beneficiary Name</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(config.bankDetails?.accountBeneficiary || config.legalName || 'Fatimyah Educational Trust', 'name')}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                    title="Copy Beneficiary Name"
                  >
                    {copiedBankField === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-xs font-black text-slate-900 block truncate" title={config.bankDetails?.accountBeneficiary || config.legalName || 'Fatimyah Educational Trust'}>
                  {config.bankDetails?.accountBeneficiary || config.legalName || 'Fatimyah Educational Trust'}
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold block">Public Charitable Trust</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Account Number</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(config.bankDetails?.accountNumber || '389402019482', 'acc')}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedBankField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="font-mono font-black text-xs text-slate-900 block">
                  {config.bankDetails?.accountNumber || '389402019482'}
                </span>
                <span className="text-[10px] text-slate-500 block">{config.bankDetails?.accountType || 'Current Account'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">IFSC & Bank</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(config.bankDetails?.ifscCode || 'SBIN0000300', 'ifsc')}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                    title="Copy IFSC Code"
                  >
                    {copiedBankField === 'ifsc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="font-mono font-black text-xs text-slate-900 block">
                  {config.bankDetails?.ifscCode || 'SBIN0000300'}
                </span>
                <span className="text-[10px] text-slate-500 block truncate" title={`${config.bankDetails?.bankName || 'State Bank of India'} • ${config.bankDetails?.branch || 'Main Branch'}`}>
                  {config.bankDetails?.bankName || 'State Bank of India'} • {config.bankDetails?.branch || 'Main Branch'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Direct UPI ID</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(config.bankDetails?.upiId || 'fetindia@sbi', 'upi')}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedBankField === 'upi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="font-mono font-black text-xs text-emerald-800 block">
                  {config.bankDetails?.upiId || 'fetindia@sbi'}
                </span>
                <span className="text-[10px] text-slate-500 block">Instant BHIM / GPay / PhonePe</span>
              </div>

            </div>

            {config.bankDetails?.instructions && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {config.bankDetails.instructions}
              </p>
            )}

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Form 10BE Tax Exemption Certificate:</strong> {config.bankDetails?.referenceInstructions || `After initiating a direct NEFT/RTGS or UPI transfer, please email your transaction reference (UTR) and PAN card number to ${config.contactEmail || 'contact@fetindia.com'} or contact ${config.contactPhone || '+91 91494 14549'} to instantly receive your digitally signed Form 10BE statutory tax receipt.`}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* SUCCESS RECEIPT MODAL (FOR RAZORPAY MONETARY DONATIONS)                   */}
      {/* ========================================================================= */}
      {successReceiptData && (
        <PrintableDonationReceiptModal
          isOpen={true}
          receipt={successReceiptData}
          onClose={() => setSuccessReceiptData(null)}
        />
      )}

    </div>
  );
};
