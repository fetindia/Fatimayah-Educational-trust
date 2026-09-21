/**
 * @license
 * Manual Donation & Direct Bank Transfer Settings Component
 * Fatimyah Educational Trust India
 * 
 * Super Admin Exclusive Control Panel for managing official trust bank
 * account details, IFSC, UPI ID, and manual donation instructions.
 */

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Building,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit,
  Save,
  X,
  RotateCcw,
  Copy,
  Info,
  Check,
  Power,
  FileText,
  HelpCircle,
  Lock
} from 'lucide-react';
import { useConfig } from '../../../contexts/ConfigContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ManualDonationBankDetails } from '../../../types';
import { DEFAULT_ORG_CONFIG } from '../../../data/initialData';

// IFSC Code Regex: 4 letters, 0, 6 alphanumeric chars
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// UPI ID Regex: standard VPA format (e.g. name@bank)
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

// Account Number Regex: 9 to 20 digits or alphanumeric
const ACC_REGEX = /^[0-9A-Za-z]{9,20}$/;

export const AdminManualDonationSettings: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const { currentUser, isSuperAdmin } = useAuth();

  // Active bank details from config or fallback to defaults
  const currentBank: ManualDonationBankDetails = config.bankDetails || DEFAULT_ORG_CONFIG.bankDetails || {
    accountBeneficiary: 'Fatimyah Educational Trust',
    bankName: 'State Bank of India',
    branch: 'Mumbai Main Branch',
    accountNumber: '389402019482',
    ifscCode: 'SBIN0000300',
    accountType: 'Current Account',
    upiId: 'fetindia@sbi',
    instructions: 'Donors may transfer contributions directly via NEFT, RTGS, IMPS, or UPI. All direct contributions are eligible for 50% tax exemption under Section 80G.',
    referenceInstructions: 'After initiating the transfer, please email your transaction reference (UTR) and PAN details to contact@fetindia.com to receive your official Form 10BE tax exemption receipt.',
    isEnabled: true
  };

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<ManualDonationBankDetails>(currentBank);
  const [errors, setErrors] = useState<Partial<Record<keyof ManualDonationBankDetails, string>>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Sync formData whenever remote config changes and not actively editing
  useEffect(() => {
    if (!isEditing) {
      setFormData(currentBank);
    }
  }, [config.bankDetails, isEditing]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validateField = (name: keyof ManualDonationBankDetails, value: string | boolean | undefined): string | null => {
    switch (name) {
      case 'accountBeneficiary':
        if (!value || typeof value !== 'string' || value.trim().length < 3) {
          return 'Beneficiary name is required (minimum 3 characters).';
        }
        if (value.trim().length > 100) {
          return 'Beneficiary name cannot exceed 100 characters.';
        }
        return null;

      case 'bankName':
        if (!value || typeof value !== 'string' || value.trim().length < 2) {
          return 'Bank name is required (minimum 2 characters).';
        }
        return null;

      case 'branch':
        if (!value || typeof value !== 'string' || value.trim().length < 2) {
          return 'Branch name or location is required.';
        }
        return null;

      case 'accountNumber': {
        const cleanAcc = typeof value === 'string' ? value.replace(/\s+/g, '') : '';
        if (!cleanAcc) {
          return 'Account number is required.';
        }
        if (!ACC_REGEX.test(cleanAcc)) {
          return 'Account number must be 9 to 20 digits (or alphanumeric characters).';
        }
        return null;
      }

      case 'ifscCode': {
        const cleanIfsc = typeof value === 'string' ? value.trim().toUpperCase() : '';
        if (!cleanIfsc) {
          return 'IFSC code is required.';
        }
        if (cleanIfsc.length !== 11) {
          return 'IFSC code must be exactly 11 characters long.';
        }
        if (!IFSC_REGEX.test(cleanIfsc)) {
          return 'Invalid IFSC format. Must be 4 letters, 5th character "0", and 6 alphanumeric characters (e.g. SBIN0000300).';
        }
        return null;
      }

      case 'accountType':
        if (!value || typeof value !== 'string' || value.trim().length < 2) {
          return 'Account type is required (e.g. Current Account, Savings Account).';
        }
        return null;

      case 'upiId': {
        if (!value || typeof value !== 'string' || !value.trim()) {
          return null; // UPI ID is optional
        }
        const cleanUpi = value.trim();
        if (!UPI_REGEX.test(cleanUpi)) {
          return 'Invalid UPI ID format. Must follow standard handle pattern (e.g. name@bank).';
        }
        return null;
      }

      default:
        return null;
    }
  };

  const validateAll = (data: ManualDonationBankDetails): boolean => {
    const newErrors: Partial<Record<keyof ManualDonationBankDetails, string>> = {};

    const fieldsToValidate: (keyof ManualDonationBankDetails)[] = [
      'accountBeneficiary',
      'bankName',
      'branch',
      'accountNumber',
      'ifscCode',
      'accountType',
      'upiId'
    ];

    for (const field of fieldsToValidate) {
      const err = validateField(field, data[field]);
      if (err) {
        newErrors[field] = err;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ManualDonationBankDetails, value: string | boolean) => {
    let processedValue = value;
    if (field === 'ifscCode' && typeof value === 'string') {
      processedValue = value.toUpperCase().replace(/\s+/g, '');
    } else if (field === 'accountNumber' && typeof value === 'string') {
      processedValue = value.replace(/\s+/g, '');
    } else if (field === 'upiId' && typeof value === 'string') {
      processedValue = value.toLowerCase().replace(/\s+/g, '');
    }

    const updated = { ...formData, [field]: processedValue };
    setFormData(updated);

    // Clear inline error if field becomes valid
    const fieldError = validateField(field, processedValue);
    setErrors(prev => ({
      ...prev,
      [field]: fieldError || undefined
    }));
  };

  const handleQuickToggleEnable = async () => {
    if (!isSuperAdmin || !currentUser) {
      setSaveError('Permission denied: Only Super Admin can modify donation settings.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const newEnabledState = !currentBank.isEnabled;
      const updatedDetails: ManualDonationBankDetails = {
        ...currentBank,
        isEnabled: newEnabledState
      };

      await updateConfig({
        bankDetails: updatedDetails
      }, {
        uid: currentUser.uid,
        email: currentUser.email || 'superadmin@fetindia.com',
        role: 'super_admin'
      });

      setSaveSuccess(
        newEnabledState
          ? 'Manual Bank Transfer donation option is now ACTIVE and visible on the public website.'
          : 'Manual Bank Transfer donation option has been DISABLED on the public website.'
      );
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to toggle bank transfer status:', err);
      setSaveError(err?.message || 'Failed to update settings in Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isSuperAdmin || !currentUser) {
      setSaveError('Unauthorized: Only Super Admin can save manual donation bank details.');
      return;
    }

    if (!validateAll(formData)) {
      setSaveError('Please resolve all validation errors before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Sanitized payload ensuring only expected clean fields are persisted
      const cleanDetails: ManualDonationBankDetails = {
        accountBeneficiary: formData.accountBeneficiary.trim(),
        bankName: formData.bankName.trim(),
        branch: formData.branch.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        accountType: (formData.accountType || 'Current Account').trim(),
        upiId: formData.upiId?.trim().toLowerCase() || '',
        instructions: formData.instructions?.trim() || '',
        referenceInstructions: formData.referenceInstructions?.trim() || '',
        isEnabled: Boolean(formData.isEnabled)
      };

      await updateConfig({
        bankDetails: cleanDetails
      }, {
        uid: currentUser.uid,
        email: currentUser.email || 'superadmin@fetindia.com',
        role: 'super_admin'
      });

      setSaveSuccess('Manual donation account details successfully saved and published in real time.');
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to save manual donation details:', err);
      setSaveError(err?.message || 'Failed to persist bank details to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!isSuperAdmin || !currentUser) {
      setSaveError('Unauthorized: Only Super Admin can reset configuration.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const defaultDetails = DEFAULT_ORG_CONFIG.bankDetails || {
        accountBeneficiary: 'Fatimyah Educational Trust',
        bankName: 'State Bank of India',
        branch: 'Mumbai Main Branch',
        accountNumber: '389402019482',
        ifscCode: 'SBIN0000300',
        accountType: 'Current Account',
        upiId: 'fetindia@sbi',
        instructions: 'Donors may transfer contributions directly via NEFT, RTGS, IMPS, or UPI. All direct contributions are eligible for 50% tax exemption under Section 80G.',
        referenceInstructions: 'After initiating the transfer, please email your transaction reference (UTR) and PAN details to contact@fetindia.com to receive your official Form 10BE tax exemption receipt.',
        isEnabled: true
      };

      await updateConfig({
        bankDetails: defaultDetails
      }, {
        uid: currentUser.uid,
        email: currentUser.email || 'superadmin@fetindia.com',
        role: 'super_admin'
      });

      setFormData(defaultDetails);
      setShowResetConfirm(false);
      setIsEditing(false);
      setSaveSuccess('Bank transfer settings successfully reset to standard official trust defaults.');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error('Reset bank details error:', err);
      setSaveError(err?.message || 'Failed to reset settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(currentBank);
    setErrors({});
    setSaveError(null);
    setIsEditing(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3" id="manual-donation-unauthorized-box">
        <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold">Access Restricted: Super Admin Only</h3>
          <p className="text-xs text-amber-800 mt-1">
            Manual donation bank transfer account parameters can only be modified by the Super Admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="super-admin-manual-donation-settings-panel">
      {/* Header Bar */}
      <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Manual Donation Account Details (Bank Transfer & UPI)
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                currentBank.isEnabled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                {currentBank.isEnabled ? 'Active on Public Site' : 'Disabled (Hidden from Donors)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Super Admin control center for the official trust bank transfer details displayed dynamically to donors on the public donation page and campaign modals.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isEditing ? (
            <>
              {/* Quick Enable/Disable Toggle */}
              <button
                type="button"
                id="btn-toggle-manual-donation"
                onClick={handleQuickToggleEnable}
                disabled={isSaving}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all ${
                  currentBank.isEnabled
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 shadow-xs'
                }`}
                title={currentBank.isEnabled ? 'Disable manual bank transfers on public site' : 'Enable manual bank transfers on public site'}
              >
                <Power className={`w-3.5 h-3.5 ${currentBank.isEnabled ? 'text-slate-600' : 'text-emerald-200'}`} />
                <span>{currentBank.isEnabled ? 'Disable Transfers' : 'Enable Transfers'}</span>
              </button>

              {/* Edit Button */}
              <button
                type="button"
                id="btn-edit-manual-donation"
                onClick={() => {
                  setFormData(currentBank);
                  setErrors({});
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-900 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Account Details</span>
              </button>
            </>
          ) : (
            <>
              {/* Cancel Button */}
              <button
                type="button"
                id="btn-cancel-manual-donation"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5 inline mr-1" />
                <span>Cancel</span>
              </button>

              {/* Save Button */}
              <button
                type="button"
                id="btn-save-manual-donation"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white border border-emerald-900 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Publish</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saveSuccess && (
        <div className="mx-6 sm:mx-7 mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in" id="manual-donation-save-success-banner">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="mx-6 sm:mx-7 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between animate-in fade-in" id="manual-donation-save-error-banner">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-rose-700 hover:text-rose-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="p-6 sm:p-7 space-y-6">
        {isEditing ? (
          /* ============================================================== */
          /* EDIT MODE FORM                                                 */
          /* ============================================================== */
          <form onSubmit={handleSave} className="space-y-6" id="manual-donation-edit-form">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Real-time Public Synchronization:</span> Saving these details immediately updates the public Donation portal, 80G tax calculator section, and campaign manual transfer modals in Firestore without code redeployment.
              </div>
            </div>

            {/* Master Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <label htmlFor="input-donation-enabled" className="text-xs font-bold text-slate-900 block cursor-pointer">
                  Accept Direct Bank Transfers / Manual Donations
                </label>
                <p className="text-[11px] text-slate-500">
                  When enabled, donors see this official bank account and UPI details on the website. If disabled, donors are advised to use the secure gateway.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="input-donation-enabled"
                  checked={Boolean(formData.isEnabled)}
                  onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Grid of Bank Account Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Beneficiary Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-beneficiary">
                  <span>1. Account Beneficiary / Holder Name <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Official legal title</span>
                </label>
                <input
                  type="text"
                  id="input-beneficiary"
                  value={formData.accountBeneficiary}
                  onChange={(e) => handleInputChange('accountBeneficiary', e.target.value)}
                  placeholder="e.g. Fatimyah Educational Trust"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
                    errors.accountBeneficiary
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500 text-rose-900'
                      : 'border-slate-300 bg-white focus:ring-emerald-600 text-slate-900'
                  }`}
                />
                {errors.accountBeneficiary && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.accountBeneficiary}</p>
                )}
              </div>

              {/* 2. Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-bank-name">
                  <span>2. Bank Name <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Institutional bank</span>
                </label>
                <input
                  type="text"
                  id="input-bank-name"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
                    errors.bankName
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500 text-rose-900'
                      : 'border-slate-300 bg-white focus:ring-emerald-600 text-slate-900'
                  }`}
                />
                {errors.bankName && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.bankName}</p>
                )}
              </div>

              {/* 3. Account Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-account-number">
                  <span>3. Account Number <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">9-20 digits</span>
                </label>
                <input
                  type="text"
                  id="input-account-number"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="e.g. 389402019482"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs font-bold focus:outline-none focus:ring-2 ${
                    errors.accountNumber
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500 text-rose-900'
                      : 'border-slate-300 bg-white focus:ring-emerald-600 text-slate-900'
                  }`}
                />
                {errors.accountNumber && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.accountNumber}</p>
                )}
              </div>

              {/* 4. IFSC Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-ifsc-code">
                  <span>4. IFSC Code (RTGS / NEFT / IMPS) <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">11 characters (5th is '0')</span>
                </label>
                <input
                  type="text"
                  id="input-ifsc-code"
                  maxLength={11}
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                  placeholder="e.g. SBIN0000300"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono uppercase text-xs font-bold focus:outline-none focus:ring-2 ${
                    errors.ifscCode
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500 text-rose-900'
                      : 'border-slate-300 bg-white focus:ring-emerald-600 text-slate-900'
                  }`}
                />
                {errors.ifscCode ? (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.ifscCode}</p>
                ) : (
                  <p className="text-[10px] text-slate-400">Must be 11 characters. 4 letters, zero, 6 characters (e.g. SBIN0000300).</p>
                )}
              </div>

              {/* 5. Branch Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-branch-name">
                  <span>5. Branch Name & City <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Branch location</span>
                </label>
                <input
                  type="text"
                  id="input-branch-name"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  placeholder="e.g. Mumbai Main Branch"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
                    errors.branch
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500 text-rose-900'
                      : 'border-slate-300 bg-white focus:ring-emerald-600 text-slate-900'
                  }`}
                />
                {errors.branch && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.branch}</p>
                )}
              </div>

              {/* 6. Account Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-account-type">
                  <span>6. Account Type <span className="text-rose-600">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Operating banking category</span>
                </label>
                <select
                  id="input-account-type"
                  value={formData.accountType || 'Current Account'}
                  onChange={(e) => handleInputChange('accountType', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="Current Account">Current Account (Institutional Trust)</option>
                  <option value="Savings Account">Savings Bank Account</option>
                  <option value="Public Trust Account">Public Charitable Trust Account</option>
                </select>
              </div>

              {/* 7. UPI ID */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-upi-id">
                  <span>7. Official Trust UPI ID (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">For direct VPA/QR scanning</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-upi-id"
                    value={formData.upiId || ''}
                    onChange={(e) => handleInputChange('upiId', e.target.value)}
                    placeholder="e.g. fetindia@sbi"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs font-bold focus:outline-none focus:ring-2 ${
                      errors.upiId
                        ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500 text-rose-900'
                        : 'border-slate-300 bg-white focus:ring-emerald-600 text-slate-900'
                    }`}
                  />
                </div>
                {errors.upiId ? (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.upiId}</p>
                ) : (
                  <p className="text-[10px] text-slate-400">Leave blank if UPI direct handle is not active. Valid format: username@bankname.</p>
                )}
              </div>

              {/* 8. Donation Instructions / Message */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-instructions">
                  <span>8. General Donation Instructions / Message</span>
                  <span className="text-[10px] text-slate-400 font-normal">Displayed above bank details</span>
                </label>
                <textarea
                  id="input-instructions"
                  rows={2}
                  value={formData.instructions || ''}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="e.g. Donors may transfer contributions directly via NEFT, RTGS, IMPS, or UPI. All direct contributions are eligible for 50% tax exemption under Section 80G."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* 9. Payment / Reference Instructions */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="input-reference-instructions">
                  <span>9. Payment / UTR Reference Instructions (Receipt Issuance)</span>
                  <span className="text-[10px] text-slate-400 font-normal">How donors submit UTR / claim Form 10BE</span>
                </label>
                <textarea
                  id="input-reference-instructions"
                  rows={2}
                  value={formData.referenceInstructions || ''}
                  onChange={(e) => handleInputChange('referenceInstructions', e.target.value)}
                  placeholder="e.g. After initiating the transfer, please email your transaction reference (UTR) and PAN details to contact@fetindia.com to receive your official Form 10BE tax exemption receipt."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs font-bold text-slate-500 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Trust Defaults</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white border border-emerald-900 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Publish Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ============================================================== */
          /* READ-ONLY VIEW MODE                                            */
          /* ============================================================== */
          <div className="space-y-6" id="manual-donation-read-only-view">
            {/* Status Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              currentBank.isEnabled
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  currentBank.isEnabled ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">
                    {currentBank.isEnabled
                      ? 'Manual Bank Transfer Channel is Active'
                      : 'Manual Bank Transfer Channel is Currently Disabled'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {currentBank.isEnabled
                      ? 'Public donors are seeing these bank and UPI details on the 80G donation page and campaign modals.'
                      : 'Public donors will not see bank details; they will be directed to the online payment gateway.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickToggleEnable}
                disabled={isSaving}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 cursor-pointer ${
                  currentBank.isEnabled
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                }`}
              >
                {currentBank.isEnabled ? 'Pause Channel' : 'Activate Channel'}
              </button>
            </div>

            {/* Structured Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Beneficiary & Bank */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Beneficiary Entity
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                    {currentBank.accountType || 'Current Account'}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {currentBank.accountBeneficiary}
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-700">
                  <Building className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span className="font-bold">{currentBank.bankName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">{currentBank.branch}</span>
                </div>
              </div>

              {/* Card 2: Account Number & IFSC */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Account & Routing Codes
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">RTGS / NEFT / IMPS</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Account Number</span>
                    <span className="text-sm font-mono font-black text-slate-900">{currentBank.accountNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentBank.accountNumber, 'acc')}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedKey === 'acc' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">IFSC Code</span>
                    <span className="text-sm font-mono font-black text-emerald-800">{currentBank.ifscCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentBank.ifscCode, 'ifsc')}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer"
                    title="Copy IFSC Code"
                  >
                    {copiedKey === 'ifsc' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Card 3: UPI ID */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-900">Direct Trust UPI Handle</span>
                  </div>
                  {currentBank.upiId ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Configured
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                      Not Configured
                    </span>
                  )}
                </div>
                {currentBank.upiId ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="font-mono font-extrabold text-sm text-emerald-800">{currentBank.upiId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentBank.upiId || '', 'upi')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'upi' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No UPI ID currently set. Donors will transfer via NEFT/RTGS account number.</p>
                )}
              </div>

              {/* Card 4: Instructions */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Donation Instructions & Reference Guidance
                </span>
                {currentBank.instructions && (
                  <div className="text-xs text-slate-700 leading-relaxed p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Donor Guidance Note:</span>
                    {currentBank.instructions}
                  </div>
                )}
                {currentBank.referenceInstructions && (
                  <div className="text-xs text-slate-700 leading-relaxed p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Receipt & UTR Verification Note:</span>
                    {currentBank.referenceInstructions}
                  </div>
                )}
              </div>
            </div>

            {/* Live Donor Preview Banner */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <h4 className="text-xs font-extrabold text-emerald-950">
                    Live Donor Interface Preview (Public Website Appearance)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  What Donors See
                </span>
              </div>

              {currentBank.isEnabled ? (
                <div className="p-4 bg-white rounded-xl border border-emerald-300 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-slate-700" />
                      <span>{currentBank.bankName} ({currentBank.branch})</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {currentBank.accountType || 'Current Account'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">BENEFICIARY</span>
                      <span className="font-extrabold text-slate-900">{currentBank.accountBeneficiary}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">ACCOUNT NUMBER</span>
                      <span className="font-mono font-bold text-slate-900">{currentBank.accountNumber}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">IFSC CODE</span>
                      <span className="font-mono font-bold text-slate-900">{currentBank.ifscCode}</span>
                    </div>
                    {currentBank.upiId && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">TRUST UPI ID</span>
                        <span className="font-mono font-bold text-emerald-800">{currentBank.upiId}</span>
                      </div>
                    )}
                  </div>

                  {currentBank.referenceInstructions && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {currentBank.referenceInstructions}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  Manual Bank Transfer is currently disabled. Donors are directed to the automated online payment gateway.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Reset to Defaults */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in" id="reset-confirm-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Reset Bank Details to Defaults?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will overwrite the current manual donation account parameters with the official default SBI account of Fatimyah Educational Trust (Account: 389402019482, IFSC: SBIN0000300).
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {isSaving ? 'Resetting...' : 'Yes, Reset to Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
