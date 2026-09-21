/**
 * @license
 * 80G Tax Exemption Donation & Calculator Portal
 * Fatimyah Educational Trust India
 */

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Calculator, 
  CheckCircle2, 
  Copy, 
  Download, 
  Building, 
  ArrowRight,
  Info,
  BadgePercent,
  QrCode,
  FileCheck2,
  Sparkles,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Lock,
  CreditCard,
  Printer,
  Landmark
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchRazorpayConfig, 
  initiateRazorpayContribution, 
  RazorpayPublicConfig, 
  PaymentVerificationResult 
} from '../../lib/razorpay';
import { PrintableDonationReceiptModal } from '../donor/PrintableDonationReceiptModal';

interface PublicDonationSectionProps {
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

export const PublicDonationSection: React.FC<PublicDonationSectionProps> = ({ onOpenLegal }) => {
  const { config } = useConfig();
  const { currentUser } = useAuth();

  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCause, setSelectedCause] = useState<string>('Higher Education Scholarships');
  const [taxSlabRate, setTaxSlabRate] = useState<number>(30); // 30% tax bracket
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorPan, setDonorPan] = useState<string>('');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedReference, setRecordedReference] = useState<string>('');
  const [verifiedPayment, setVerifiedPayment] = useState<PaymentVerificationResult | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState<RazorpayPublicConfig | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  useEffect(() => {
    fetchRazorpayConfig().then(setGatewayConfig).catch(console.warn);
  }, []);

  const effectiveAmount = customAmount ? Number(customAmount) || 0 : selectedAmount;
  
  // Under Section 80G: 50% of donated amount is deductible from taxable income.
  // Tax savings = (Donation * 50%) * (Tax Slab Rate / 100)
  const deductibleIncome = Math.round(effectiveAmount * 0.5);
  const estimatedTaxSavings = Math.round(deductibleIncome * (taxSlabRate / 100));
  const effectiveCostOfDonation = Math.max(0, effectiveAmount - estimatedTaxSavings);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleProceedPayment = async (preferredMethod: 'all' | 'upi' | 'qr' = 'all') => {
    if (effectiveAmount < 100) {
      setErrorMessage('Minimum contribution amount is ₹100.');
      return;
    }
    if (!donorName.trim()) {
      setErrorMessage('Please provide your full legal name as per PAN.');
      return;
    }
    if (!donorEmail.trim()) {
      setErrorMessage('Please provide a valid email address for Form 10BE dispatch.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    await initiateRazorpayContribution({
      orderParams: {
        amount: effectiveAmount,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        donorPhone: donorPhone.trim() || undefined,
        donorPan: donorPan.trim().toUpperCase() || undefined,
        campaignId: 'direct-80g-trust-allocation',
        campaignTitle: selectedCause,
        donorUid: currentUser?.uid,
        isAnonymous: false,
        message: `80G General Trust Allocation: ${selectedCause}`
      },
      preferredMethod,
      onOrderCreated: (order) => {
        setRecordedReference(order.internalReference);
      },
      onSuccess: (result) => {
        setVerifiedPayment(result);
        setDonationSuccess(true);
        setIsSubmitting(false);
      },
      onError: (err) => {
        setErrorMessage(err);
        setIsSubmitting(false);
      },
      onDismiss: () => {
        setIsSubmitting(false);
      }
    });
  };

  const handleSubmitPledge = (e: React.FormEvent) => {
    e.preventDefault();
    handleProceedPayment('all');
  };

  const handlePrintReceipt = () => {
    setShowReceiptModal(true);
  };

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200" id="donate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-800" />
            <span>Section 80G & 12A Certified • 50% Income Tax Exemption</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Support Educating Deserving Scholars with 80G Tax Exemption
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every rupee donated directly funds tuition fees, textbooks, and medical relief. Under Section 80G(5)(vi) of the Indian Income Tax Act, 1961, donors receive an official tax deduction certificate.
          </p>
        </div>

        {/* 2-Column Donation & Calculator Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive 80G Donation Form (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 space-y-6 shadow-xs">
            
            {donationSuccess ? (
              <div className="p-6 sm:p-8 bg-emerald-50 border border-emerald-300 rounded-3xl text-center space-y-5 shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                  <ShieldCheck className="w-9 h-9 text-emerald-700" />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Razorpay Verified • 80G Tax Deductible</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-emerald-950">Official Contribution Confirmed</h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Your contribution of <strong>₹{effectiveAmount.toLocaleString()}</strong> for <em>{selectedCause}</em> has been securely verified by Razorpay. An official <strong>Form 10BE / 80G Certificate</strong> is generated below for tax filing.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-left space-y-2.5 text-xs shadow-xs">
                  <div className="flex justify-between items-center bg-emerald-50/80 p-2 rounded-xl border border-emerald-100 font-mono text-[11px]">
                    <span className="text-slate-600 font-sans font-bold">80G Receipt No:</span>
                    <span className="font-extrabold text-emerald-950">{verifiedPayment?.receiptNumber || 'REC/80G/2026/VERIFIED'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-mono text-[11px] px-1">
                    <span>Razorpay Payment ID:</span>
                    <span className="font-bold text-slate-900">{verifiedPayment?.paymentId || 'pay_gateway_verified'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-mono text-[11px] px-1">
                    <span>Internal Ref:</span>
                    <span className="font-bold text-slate-800">{recordedReference || 'FET-DON-CONFIRMED'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 px-1">
                    <span>Donor Name:</span>
                    <span>{donorName || 'Valued Contributor'}</span>
                  </div>
                  {donorPan && (
                    <div className="flex justify-between text-slate-600 font-mono px-1">
                      <span>Donor PAN:</span>
                      <span className="font-bold text-slate-900">{donorPan}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 px-1">
                    <span>Fund Allocation:</span>
                    <span className="font-bold text-slate-800 text-right">{selectedCause}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-100 pt-2 px-1">
                    <span>Eligible 80G Tax Deduction:</span>
                    <span>₹{deductibleIncome.toLocaleString()} (50% under Sec 80G)</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 px-1">
                    <span>FET India Trust 80G Reg:</span>
                    <span className="font-mono font-bold text-slate-700">AAATF2843PF20214</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="px-4 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>View / Print / Download 80G Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDonationSuccess(false);
                      setRecordedReference('');
                      setVerifiedPayment(null);
                    }}
                    className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Make Another Contribution
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPledge} className="space-y-6">
                
                {/* 1. Choose Cause */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    1. Select Specific Trust Fund Allocation
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { name: 'Higher Education Scholarships', sub: 'BE, MBBS & Degree Grants' },
                      { name: 'General Community Welfare & Ration', sub: 'Widows & Orphan Food Care' },
                      { name: 'Zakat & Sadaqah Fund (100% Direct)', sub: 'Zero Admin Fee Deductions' },
                      { name: 'Emergency Medical Relief & Dialysis', sub: 'Lifesaving Surgeries & Care' }
                    ].map((cause) => (
                      <button
                        key={cause.name}
                        type="button"
                        onClick={() => setSelectedCause(cause.name)}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                          selectedCause === cause.name
                            ? 'border-emerald-700 bg-emerald-800 text-white shadow-xs'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-extrabold block">{cause.name}</span>
                        <span className={`text-[10px] block mt-0.5 ${selectedCause === cause.name ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {cause.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Choose Amount */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    2. Contribution Amount (INR ₹)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[1000, 2500, 5000, 10000, 25000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-center text-xs font-extrabold transition-all cursor-pointer ${
                          selectedAmount === amt && !customAmount
                            ? 'border-emerald-700 bg-emerald-800 text-white shadow-xs'
                            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        ₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2">
                    <input
                      type="number"
                      placeholder="Or enter custom amount in ₹"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* 3. Donor Details for 80G Certificate */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    3. Donor Details (Required for Official Form 10BE / 80G Receipt)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Name (As on PAN)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Dr. Aamir Khan"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="aamir@example.com"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PAN Number (Permanent Account Number)</label>
                      <input
                        type="text"
                        maxLength={10}
                        required
                        placeholder="e.g., ABCDE1234F"
                        value={donorPan}
                        onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono uppercase font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile (for UPI & Instant SMS Receipt)</label>
                      <input
                        type="tel"
                        placeholder="e.g., +91 98765 43210"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Mandatory by Income Tax Department under Rule 18AB for official Form 10BE / 80G tax credit.
                  </span>
                </div>

                {/* Gateway Trust & Security Notice */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">Razorpay Certified Payment Gateway</span>
                      <span className="text-[10px] text-slate-500">256-Bit SSL • PCI-DSS Level 1 • Immediate Form 10BE</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-bold uppercase">
                    {gatewayConfig?.mode === 'live' ? 'Live Gateway' : 'Sandbox Active'}
                  </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5 font-medium animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-amber-300 animate-spin" />
                        <span>Initializing Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-amber-300" />
                        <span>Contribute ₹{effectiveAmount.toLocaleString()} with Razorpay</span>
                        <ArrowRight className="w-4 h-4 text-amber-300 ml-1" />
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleProceedPayment('upi')}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                      title="Launch UPI Intent on mobile (GPay, PhonePe, Paytm)"
                    >
                      <Smartphone className="w-4 h-4 text-amber-300" />
                      <span>Pay via UPI App (GPay / PhonePe)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleProceedPayment('qr')}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-60 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      title="Dynamic UPI QR Code via Razorpay"
                    >
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span>Scan Razorpay UPI QR</span>
                    </button>
                  </div>
                </div>

                {/* Legal & Statutory Trust Disclosure */}
                <div className="pt-2 text-center text-[11px] text-slate-500 leading-normal border-t border-slate-200/80">
                  <span>By proceeding, you agree to FET India's </span>
                  <button 
                    type="button" 
                    onClick={() => onOpenLegal ? onOpenLegal('terms') : undefined} 
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Terms of Trust
                  </button>
                  <span> and </span>
                  <button 
                    type="button" 
                    onClick={() => onOpenLegal ? onOpenLegal('privacy') : undefined} 
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <span>. 50% Tax Deduction under Section 80G(5)(vi).</span>
                </div>

              </form>
            )}

          </div>

          {/* Right Column: 80G Tax Exemption Real-Time Breakdown & Bank Details (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 80G Mathematical Tax Benefit Box */}
            <div className="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  <span>Section 80G Tax Savings Breakdown</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900">
                  50% Deduction
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Your Donated Amount:</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{effectiveAmount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span>Deductible from Gross Income (50%):</span>
                  <span className="font-extrabold text-emerald-800">₹{deductibleIncome.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 block text-[11px]">Estimated Tax Saved (30% Bracket):</span>
                    <span className="text-base font-black text-emerald-900">₹{estimatedTaxSavings.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-600 block text-[11px]">Effective Net Cost to You:</span>
                    <span className="text-base font-black text-slate-900">₹{effectiveCostOfDonation.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-emerald-200 text-[10px] text-slate-600 leading-relaxed flex items-start gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>Section 80G allows 50% deduction without qualifying limit under Section 80G(5)(vi). An official Form 10BE certificate is issued for each donation.</span>
              </div>
            </div>

            {/* Official Trust Banking Details for Direct Transfer */}
            {config.bankDetails?.isEnabled !== false ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs" id="manual-bank-transfer-details-section">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-800" />
                    <span>Direct Bank Transfer / Manual Donation</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    80G Eligible
                  </span>
                </div>

                {config.bankDetails?.instructions && (
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {config.bankDetails.instructions}
                  </p>
                )}

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Account Beneficiary</span>
                      <span className="font-extrabold text-slate-900">
                        {config.bankDetails?.accountBeneficiary || config.legalName}
                      </span>
                    </div>
                    {config.bankDetails?.accountType && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {config.bankDetails.accountType}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Bank & Branch</span>
                      <span className="font-bold text-slate-900">
                        {config.bankDetails?.bankName || 'State Bank of India'} ({config.bankDetails?.branch || 'Mumbai Main Branch'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Account Number</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        {config.bankDetails?.accountNumber || '389402019482'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.bankDetails?.accountNumber || '389402019482', 'acc')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
                      title="Copy Account Number"
                    >
                      {copiedField === 'acc' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">IFSC Code (RTGS / NEFT / IMPS)</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        {config.bankDetails?.ifscCode || 'SBIN0000300'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.bankDetails?.ifscCode || 'SBIN0000300', 'ifsc')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {config.bankDetails?.upiId && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Trust UPI ID</span>
                        <span className="font-mono font-extrabold text-emerald-800">
                          {config.bankDetails.upiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.bankDetails?.upiId || 'fetindia@sbi', 'upi')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedField === 'upi' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {config.bankDetails?.referenceInstructions && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{config.bankDetails.referenceInstructions}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2 shadow-xs" id="manual-bank-transfer-paused-section">
                <Building className="w-6 h-6 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Direct Bank Transfer Channel Paused</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Manual bank transfers are currently undergoing institutional reconciliation. Please use the instant online gateway on the left for all tax-deductible contributions.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {showReceiptModal && (
        <PrintableDonationReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={{
            receiptNumber: verifiedPayment?.receiptNumber || recordedReference || `REC/80G/${Date.now().toString().slice(-6)}`,
            donationDate: new Date().toISOString(),
            donorName: donorName || 'Generous Benefactor',
            donorEmail: donorEmail || undefined,
            donorPhone: donorPhone || undefined,
            donorPan: donorPan || undefined,
            amount: effectiveAmount,
            paymentMode: verifiedPayment?.paymentId ? 'Razorpay Online Gateway' : 'Online / UPI',
            transactionReference: verifiedPayment?.paymentId || recordedReference || `TRX-${Date.now()}`,
            paymentGateway: 'Razorpay Verified',
            causeTitle: selectedCause,
            paymentStatus: 'verified',
            is80GClaimed: true
          }}
        />
      )}

    </section>
  );
};

