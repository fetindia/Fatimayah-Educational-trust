/**
 * @license
 * Support Campaign & Contribution Pledge Modal
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  IndianRupee, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Info, 
  Eye, 
  EyeOff, 
  Copy, 
  QrCode, 
  Building,
  Lock,
  ArrowRight,
  Receipt,
  Download,
  Share2,
  Check,
  CreditCard,
  Smartphone,
  Printer
} from 'lucide-react';
import { CrowdfundingCampaign } from '../../types';
import { recordCampaignDonation } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import {
  fetchRazorpayConfig,
  initiateRazorpayContribution,
  RazorpayPublicConfig,
  PaymentVerificationResult
} from '../../lib/razorpay';
import { PrintableDonationReceiptModal } from '../donor/PrintableDonationReceiptModal';

interface SupportCampaignModalProps {
  campaign: CrowdfundingCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  onDonationSuccess?: () => void;
}

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

export const SupportCampaignModal: React.FC<SupportCampaignModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onDonationSuccess
}) => {
  const { currentUser, userProfile } = useAuth();
  const { config } = useConfig();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('2500');
  const [donorName, setDonorName] = useState<string>(userProfile?.displayName || currentUser?.displayName || '');
  const [donorEmail, setDonorEmail] = useState<string>(currentUser?.email || '');
  const [donorPhone, setDonorPhone] = useState<string>(userProfile?.mobileNumber || '');
  const [donorPan, setDonorPan] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI Transfer / QR Code');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  
  // Post-submission receipt state
  const [submissionCompleted, setSubmissionCompleted] = useState<boolean>(false);
  const [recordedTxnId, setRecordedTxnId] = useState<string>('');
  const [verifiedPayment, setVerifiedPayment] = useState<PaymentVerificationResult | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState<RazorpayPublicConfig | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  React.useEffect(() => {
    fetchRazorpayConfig().then(setGatewayConfig).catch(console.warn);
  }, []);

  if (!isOpen || !campaign) return null;

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const isBankTransferEnabled = config.bankDetails?.isEnabled !== false;
  const bank = {
    accountName: config.bankDetails?.accountBeneficiary || config.legalName || 'Fatimyah Educational Trust',
    accountNumber: config.bankDetails?.accountNumber || '389402019482',
    ifscCode: config.bankDetails?.ifscCode || 'SBIN0000300',
    bankName: config.bankDetails?.bankName || 'State Bank of India',
    branch: config.bankDetails?.branch || 'Mumbai Main Branch',
    accountType: config.bankDetails?.accountType || 'Current Account',
    upiId: config.bankDetails?.upiId || 'fetindia@sbi',
    instructions: config.bankDetails?.instructions,
    referenceInstructions: config.bankDetails?.referenceInstructions
  };

  // UPI URL payload for instant payments
  const upiPayUri = `upi://pay?pa=${encodeURIComponent(bank.upiId || 'fetindia@sbi')}&pn=${encodeURIComponent(config.legalName || 'Fatimyah Educational Trust')}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Donation for ${campaign.campaignNumber || campaign.title.slice(0, 20)}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayUri)}`;

  const handlePayWithRazorpay = async (preferredMethod: 'all' | 'upi' | 'qr' = 'all') => {
    if (!amount || amount < 100) {
      showError('Minimum contribution amount is ₹100.');
      return;
    }

    if (!donorName.trim() && !isAnonymous) {
      showError('Please provide your name or choose to contribute anonymously.');
      return;
    }

    if (!donorEmail.trim()) {
      showError('Please provide a valid email address for Form 10BE receipt dispatch.');
      return;
    }

    setSubmitting(true);

    await initiateRazorpayContribution({
      orderParams: {
        amount,
        donorName: isAnonymous ? 'Anonymous Well-Wisher' : donorName.trim(),
        donorEmail: donorEmail.trim() || currentUser?.email || '',
        donorPhone: donorPhone.trim() || undefined,
        donorPan: donorPan.trim() ? donorPan.trim().toUpperCase() : undefined,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        donorUid: currentUser?.uid,
        isAnonymous,
        message: message.trim() || undefined
      },
      preferredMethod,
      onOrderCreated: (order) => {
        setRecordedTxnId(order.internalReference);
      },
      onSuccess: (result) => {
        setVerifiedPayment(result);
        setRecordedTxnId(result.receiptNumber || result.paymentId);
        setSubmissionCompleted(true);
        setSubmitting(false);
        if (onDonationSuccess) {
          onDonationSuccess();
        }
      },
      onError: (err) => {
        showError(err);
        setSubmitting(false);
      },
      onDismiss: () => {
        setSubmitting(false);
      }
    });
  };

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount < 100) {
      showError('Minimum contribution amount is ₹100.');
      return;
    }

    if (!donorName.trim() && !isAnonymous) {
      showError('Please provide your name or choose to contribute anonymously.');
      return;
    }

    setSubmitting(true);
    try {
      const generatedRef = transactionRef.trim() || `FET-TXN-${Date.now().toString().slice(-6)}`;
      await recordCampaignDonation({
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        donorUid: currentUser?.uid,
        donorName: isAnonymous ? 'Anonymous Well-Wisher' : donorName.trim(),
        donorEmail: donorEmail.trim() || currentUser?.email || '',
        donorPhone: donorPhone.trim(),
        donorPan: donorPan.trim() ? donorPan.trim().toUpperCase() : undefined,
        amount: Number(amount),
        transactionReference: generatedRef,
        paymentMethod,
        isAnonymous,
        message: message.trim() || undefined,
        isPreVerifiedByAdmin: false
      });

      setRecordedTxnId(generatedRef);
      setSubmissionCompleted(true);
      if (onDonationSuccess) {
        onDonationSuccess();
      }
    } catch (err: any) {
      console.error('Error recording contribution:', err);
      showError(err?.message || 'Failed to record contribution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setSubmissionCompleted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" id="support-campaign-modal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-900 border border-rose-300">
              <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {submissionCompleted ? 'Contribution Acknowledged' : 'Support This Appeal'}
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-md">{campaign.title}</p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Successful Submission View */}
        {submissionCompleted ? (
          <div className="p-6 sm:p-8 space-y-6 flex-1 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-200 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">JazakAllah Khair for Your Noble Support!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your contribution pledge of <strong className="text-emerald-800 font-black">₹{amount.toLocaleString('en-IN')}</strong> for appeal <strong>"{campaign.title}"</strong> has been recorded in our verification queue.
              </p>
            </div>

            {/* Acknowledgment Slip */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 max-w-md mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Transaction Reference</span>
                <span className="font-mono font-bold text-slate-800">{recordedTxnId}</span>
              </div>
              {verifiedPayment?.paymentId && (
                <div className="flex justify-between py-1 border-b border-slate-200 font-mono text-[11px]">
                  <span className="text-slate-500 font-sans">Razorpay Payment ID</span>
                  <span className="font-bold text-slate-900">{verifiedPayment.paymentId}</span>
                </div>
              )}
              {verifiedPayment?.receiptNumber && (
                <div className="flex justify-between py-1 border-b border-slate-200 font-mono text-[11px]">
                  <span className="text-slate-500 font-sans">80G Receipt No</span>
                  <span className="font-bold text-emerald-800">{verifiedPayment.receiptNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Donor Name</span>
                <span className="font-bold text-slate-800">{isAnonymous ? 'Anonymous Well-Wisher' : donorName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Amount</span>
                <span className="font-black text-emerald-800">₹{amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">80G Tax Exemption</span>
                <span className="font-bold text-emerald-700">Eligible (Form 10BE) • 50%</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 text-left flex items-start gap-3 max-w-md mx-auto">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {verifiedPayment 
                  ? 'Payment successfully verified via Razorpay. Your contribution is reflected on the appeal campaign and an official 80G tax receipt has been generated.'
                  : 'Once our accounts team reconciles the bank/UPI credit, the appeal\'s raised counter will update, and your official 80G tax receipt will be dispatched.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2"
                id="view-campaign-donation-receipt-btn"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>View / Print / Download 80G Receipt</span>
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Return to Campaigns
              </button>
            </div>
          </div>
        ) : (
          /* Modal Form */
          <form onSubmit={handleSubmitContribution} className="p-6 sm:p-8 space-y-6 flex-1">
            
            {/* Preset Contribution Chips */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Select Support Amount
                </label>
                <span className="text-[11px] text-emerald-700 font-bold">
                  Est. 80G Tax Exemption: ₹{Math.round(amount * 0.5).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      amount === amt
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative mt-2">
                <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="Custom amount (INR)"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-300 text-base font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Institutional Trust Account / Direct Bank Transfer Instructions */}
            {isBankTransferEnabled ? (
              <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                      FET India Direct Bank Transfer / UPI
                    </h3>
                  </div>
                  {bank.upiId ? (
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showQrCode ? 'Hide QR Code' : 'Scan UPI QR'}</span>
                    </button>
                  ) : null}
                </div>

                {/* QR Code Section */}
                {showQrCode && bank.upiId && (
                  <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-slate-900 space-y-2">
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI Payment QR Code" 
                      className="w-40 h-40 border border-slate-200 rounded-xl"
                    />
                    <p className="text-[11px] font-bold text-slate-700">Scan using GPay, PhonePe, Paytm, or BHIM</p>
                    <p className="text-[10px] text-slate-500 font-mono">Amount preset to ₹{amount.toLocaleString('en-IN')}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 block font-medium">Beneficiary</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {bank.accountType}
                      </span>
                    </div>
                    <p className="font-bold text-white truncate">{bank.accountName}</p>
                    <span className="text-[10px] text-slate-400 block font-medium mt-2">Account Number</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-300">{bank.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(bank.accountNumber)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy Account Number"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium">IFSC / Branch</span>
                    <p className="font-mono font-bold text-white">{bank.ifscCode}</p>
                    <p className="text-[10px] text-slate-400 truncate">{bank.bankName} • {bank.branch}</p>
                    {bank.upiId && (
                      <>
                        <span className="text-[10px] text-slate-400 block font-medium mt-2">UPI ID / VPA</span>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-emerald-300">{bank.upiId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(bank.upiId || '')}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy UPI ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {bank.referenceInstructions && (
                  <p className="text-[10px] text-slate-300 bg-slate-800/60 p-2 rounded-xl">
                    {bank.referenceInstructions}
                  </p>
                )}

                {copiedBank && (
                  <p className="text-[11px] text-emerald-400 text-center font-bold">
                    ✓ Details copied to clipboard!
                  </p>
                )}
              </div>
            ) : null}

            {/* Donor Identification & 80G Receipt Fields */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Donor Information & Section 80G Tax Exemption
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Full Name / Organization</label>
                  <input
                    type="text"
                    required={!isAnonymous}
                    disabled={isAnonymous}
                    value={isAnonymous ? 'Anonymous Well-Wisher' : donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Syed Murtaza Hussain"
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Email (for 80G e-Receipt)</label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="donor@example.com"
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">PAN Number (Optional for 80G Form 10BE)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={donorPan}
                    onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              {/* Payment Reference & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">UPI / Bank Transaction UTR Reference</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UTR / UPI Ref: 324512984712"
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="UPI Transfer / QR Code">UPI Transfer / QR Code</option>
                    <option value="IMPS / NEFT Direct Bank Transfer">IMPS / NEFT Direct Bank Transfer</option>
                    <option value="RTGS Transfer">RTGS Transfer</option>
                    <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
                  </select>
                </div>
              </div>

              {/* Encouraging Message */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-600">Words of Encouragement / Prayer (Optional)</label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="May Almighty Allah grant swift recovery and barakah..."
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Donor Privacy Option */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isAnonymous ? (
                    <EyeOff className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-emerald-700" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isAnonymous ? 'Display Contribution Anonymously' : 'Public Wall Contributor Display'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isAnonymous
                        ? 'Your name will be masked as "Anonymous Well-Wisher" on the public appeal ledger.'
                        : 'Your name and contribution will inspire others on the appeal page.'}
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Gateway Security Badge */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">Instant Razorpay Checkout</span>
                  <span className="text-[10px] text-slate-500">UPI, Credit/Debit Cards, NetBanking • Instant 80G Receipt</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-bold uppercase">
                {gatewayConfig?.mode === 'live' ? 'Live Gateway' : 'Sandbox Ready'}
              </span>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePayWithRazorpay('all')}
                  className="py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black text-xs transition-all shadow-md hover:shadow-emerald-800/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  id="pay-razorpay-btn"
                >
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>Pay ₹{amount.toLocaleString('en-IN')} with Razorpay</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePayWithRazorpay('upi')}
                  className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  id="pay-upi-btn"
                >
                  <Smartphone className="w-4 h-4 text-amber-300" />
                  <span>Pay via UPI App (GPay / PhonePe)</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% Direct Disbursal to Approved Beneficiary</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                  id="confirm-campaign-pledge-btn"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Record Direct Bank UTR / Cheque</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>

      {showReceiptModal && (
        <PrintableDonationReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={{
            receiptNumber: verifiedPayment?.receiptNumber || `REC/80G/${Date.now().toString().slice(-6)}`,
            donationDate: new Date().toISOString(),
            donorName: isAnonymous ? 'Anonymous Well-Wisher' : (donorName || 'Generous Benefactor'),
            donorEmail: donorEmail || undefined,
            donorPhone: donorPhone || undefined,
            donorPan: donorPan || undefined,
            amount: amount,
            paymentMode: verifiedPayment?.paymentId ? 'Razorpay Online Gateway' : (paymentMethod || 'Direct Contribution'),
            transactionReference: verifiedPayment?.paymentId || recordedTxnId || `TRX-${Date.now()}`,
            paymentGateway: verifiedPayment?.paymentId ? 'Razorpay Verified' : undefined,
            causeTitle: campaign.title,
            paymentStatus: verifiedPayment ? 'verified' : 'pending_verification',
            is80GClaimed: !!donorPan || true
          }}
        />
      )}

    </div>
  );
};

