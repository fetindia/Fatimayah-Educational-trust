/**
 * @license
 * Official FET India Identity Card Component (Front & Back)
 * Fatimyah Educational Trust India
 * Legal Name: Fatimyah Educational Trust
 * Regn. No. E-19842 (BOM) • Section 80G & 12A Certified
 *
 * Visual Reference Compliance (Step 29):
 * - General Member (Emerald Green Theme & Ribbon)
 * - Core Member / Life Member (Maroon / Crimson Theme & Ribbon)
 * - Volunteer (Navy Blue Theme & Ribbon)
 * - Donor & Patron (Bronze Amber Theme & Ribbon)
 * - Management / Executive (Obsidian Slate & Gold Theme & Ribbon)
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  Award, 
  Crown, 
  HeartHandshake, 
  BadgeDollarSign, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  CheckCircle2, 
  Droplet, 
  Calendar,
  Sparkles,
  Shield,
  Heart,
  UserCheck,
  Compass,
  FileCheck
} from 'lucide-react';
import { FETLogo } from '../common/FETLogo';
import { useConfig } from '../../contexts/ConfigContext';

export type IDCardCategory = 
  | 'general_member' 
  | 'core_member' 
  | 'volunteer' 
  | 'donor' 
  | 'staff'
  | 'management';

export interface FETIdentityCardProps {
  category: IDCardCategory;
  cardId: string;
  fullName: string;
  fatherName?: string;
  guardianName?: string;
  motherName?: string;
  photoURL?: string;
  roleTitle?: string;
  designation?: string;
  department?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  issueDate?: string;
  validUntil?: string;
  district?: string;
  state?: string;
  country?: string;
  email?: string;
  mobileNumber?: string;
  donorType?: 'individual' | 'organization';
  organizationName?: string;
  volunteerWing?: string;
  isFlipped?: boolean;
  onFlip?: () => void;
  onOpenVerification?: (id: string) => void;
  idPrefix?: string;
  scale?: number;
  className?: string;
}

export const FETIdentityCard: React.FC<FETIdentityCardProps> = ({
  category,
  cardId,
  fullName,
  fatherName,
  guardianName,
  motherName,
  photoURL,
  roleTitle,
  designation,
  department,
  bloodGroup,
  dateOfBirth,
  issueDate = '2026-01-01',
  validUntil = 'AY 2026-2027',
  district,
  state,
  country = 'India',
  email,
  mobileNumber,
  donorType,
  organizationName,
  volunteerWing,
  isFlipped = false,
  onFlip,
  onOpenVerification,
  idPrefix = 'card',
  className = ''
}) => {
  const { config } = useConfig();

  // Color theme mapping matching reference design
  const themeConfig = {
    general_member: {
      categoryLabel: 'GENERAL MEMBER',
      shortLabel: 'MEMBER',
      badgeBg: 'bg-emerald-700 text-white',
      badgeBorder: 'border-emerald-600',
      headerAccent: 'text-emerald-800',
      primaryHex: '#047857',
      cardBg: '#ffffff',
      cardBorder: '#10b981',
      idText: 'text-emerald-700',
      ribbonBg: 'bg-emerald-800',
      ribbonHex: '#065f46',
      slogan: 'TOGETHER WE BUILD A BETTER TOMORROW',
      icon: Award,
      headerTitle: 'FATIMYAH EDUCATIONAL TRUST',
      tagline: 'Minar-ul-Zulmat Ila-Noor',
      defaultRole: 'GENERAL MEMBER',
      idLabel: 'Member ID',
      extraLabel: 'Blood Group',
      extraValue: bloodGroup || 'B+'
    },
    core_member: {
      categoryLabel: 'CORE COMMITTEE MEMBER',
      shortLabel: 'LIFE MEMBER',
      badgeBg: 'bg-rose-900 text-white',
      badgeBorder: 'border-rose-800',
      headerAccent: 'text-rose-900',
      primaryHex: '#881337',
      cardBg: '#ffffff',
      cardBorder: '#be123c',
      idText: 'text-rose-800',
      ribbonBg: 'bg-rose-950',
      ribbonHex: '#4c0519',
      slogan: 'A LIFETIME COMMITMENT TO EDUCATION',
      icon: Crown,
      headerTitle: 'FATIMYAH EDUCATIONAL TRUST',
      tagline: 'Minar-ul-Zulmat Ila-Noor',
      defaultRole: 'CORE COMMITTEE MEMBER',
      idLabel: 'Member ID',
      extraLabel: 'Blood Group',
      extraValue: bloodGroup || 'O+'
    },
    volunteer: {
      categoryLabel: 'OFFICIAL VOLUNTEER',
      shortLabel: 'VOLUNTEER',
      badgeBg: 'bg-sky-800 text-white',
      badgeBorder: 'border-sky-700',
      headerAccent: 'text-sky-900',
      primaryHex: '#0369a1',
      cardBg: '#ffffff',
      cardBorder: '#0284c7',
      idText: 'text-sky-700',
      ribbonBg: 'bg-sky-950',
      ribbonHex: '#082f49',
      slogan: 'SERVICE TO HUMANITY IS SERVICE TO ALLAH',
      icon: HeartHandshake,
      headerTitle: 'FATIMYAH EDUCATIONAL TRUST',
      tagline: 'Minar-ul-Zulmat Ila-Noor',
      defaultRole: volunteerWing ? `${volunteerWing.toUpperCase()} VOLUNTEER` : 'COMMUNITY VOLUNTEER',
      idLabel: 'Volunteer ID',
      extraLabel: 'Role',
      extraValue: volunteerWing ? `${volunteerWing}` : 'Education Volunteer'
    },
    donor: {
      categoryLabel: 'OFFICIAL PATRON & DONOR',
      shortLabel: 'DONOR',
      badgeBg: 'bg-amber-700 text-white',
      badgeBorder: 'border-amber-600',
      headerAccent: 'text-amber-900',
      primaryHex: '#b45309',
      cardBg: '#ffffff',
      cardBorder: '#d97706',
      idText: 'text-amber-800',
      ribbonBg: 'bg-amber-900',
      ribbonHex: '#78350f',
      slogan: 'YOUR SUPPORT, THEIR FUTURE',
      icon: BadgeDollarSign,
      headerTitle: 'FATIMYAH EDUCATIONAL TRUST',
      tagline: 'Minar-ul-Zulmat Ila-Noor',
      defaultRole: donorType === 'organization' ? 'CORPORATE PATRON' : 'REGULAR DONOR',
      idLabel: 'Donor ID',
      extraLabel: 'Contribution Type',
      extraValue: donorType === 'organization' ? 'Corporate Patron' : 'Regular Donor'
    },
    staff: {
      categoryLabel: 'OFFICIAL TRUST STAFF & FACULTY',
      shortLabel: 'STAFF',
      badgeBg: 'bg-indigo-900 text-indigo-100',
      badgeBorder: 'border-indigo-700',
      headerAccent: 'text-indigo-950',
      primaryHex: '#312e81',
      cardBg: '#ffffff',
      cardBorder: '#4338ca',
      idText: 'text-indigo-900',
      ribbonBg: 'bg-indigo-950',
      ribbonHex: '#1e1b4b',
      slogan: 'DEDICATED SERVICE • EXCELLENCE IN EDUCATION',
      icon: UserCheck,
      headerTitle: 'FATIMYAH EDUCATIONAL TRUST',
      tagline: 'Minar-ul-Zulmat Ila-Noor',
      defaultRole: designation || roleTitle || 'OFFICIAL STAFF',
      idLabel: 'Staff ID',
      extraLabel: 'Department',
      extraValue: department || 'Academics & Operations'
    },
    management: {
      categoryLabel: 'SECRETARIAT & GOVERNANCE',
      shortLabel: 'MANAGEMENT',
      badgeBg: 'bg-slate-900 text-amber-300',
      badgeBorder: 'border-slate-800',
      headerAccent: 'text-slate-900',
      primaryHex: '#0f172a',
      cardBg: '#ffffff',
      cardBorder: '#334155',
      idText: 'text-slate-800',
      ribbonBg: 'bg-slate-950',
      ribbonHex: '#020617',
      slogan: 'LEADING WITH VISION • SERVING WITH INTEGRITY',
      icon: ShieldCheck,
      headerTitle: 'FATIMYAH EDUCATIONAL TRUST',
      tagline: 'Minar-ul-Zulmat Ila-Noor',
      defaultRole: 'TRUST MANAGEMENT',
      idLabel: 'ID No.',
      extraLabel: 'Phone',
      extraValue: mobileNumber || '+91 98765 43210'
    }
  }[category] || {
    categoryLabel: 'MEMBER',
    shortLabel: 'MEMBER',
    badgeBg: 'bg-emerald-700 text-white',
    badgeBorder: 'border-emerald-600',
    headerAccent: 'text-emerald-800',
    primaryHex: '#047857',
    cardBg: '#ffffff',
    cardBorder: '#10b981',
    idText: 'text-emerald-700',
    ribbonBg: 'bg-emerald-800',
    ribbonHex: '#065f46',
    slogan: 'TOGETHER WE BUILD A BETTER TOMORROW',
    icon: Award,
    headerTitle: 'FATIMYAH EDUCATIONAL TRUST',
    tagline: 'Minar-ul-Zulmat Ila-Noor',
    defaultRole: 'MEMBER',
    idLabel: 'Member ID',
    extraLabel: 'Blood Group',
    extraValue: bloodGroup || 'B+'
  };

  const CategoryIcon = themeConfig.icon;

  const formattedIssueDate = issueDate.includes('T') 
    ? new Date(issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : (issueDate || '01 JAN 2026');

  // Determine father/mother/guardian label
  const parentName = fatherName || motherName || guardianName;
  const parentPrefix = fatherName ? "Father's Name" : (motherName ? "Mother's Name" : (guardianName ? "Guardian" : "Parent / Guardian"));

  // Verification URL for QR code
  const verifyUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/#verify?id=${encodeURIComponent(cardId)}`
    : `https://fetindia.com/#verify?id=${encodeURIComponent(cardId)}`;

  const handleVerificationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenVerification) {
      onOpenVerification(cardId);
    }
  };

  return (
    <div 
      className={`relative w-full aspect-[1.586/1] min-h-[220px] sm:min-h-[250px] max-w-[520px] mx-auto rounded-2xl sm:rounded-3xl text-slate-900 shadow-xl transition-all duration-500 select-none overflow-hidden border border-slate-300 ring-1 ring-black/10 bg-white ${className}`}
      id={`${idPrefix}-${cardId}`}
    >
      {/* Trust Watermark Crest in Center Background */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.07] pointer-events-none scale-125">
        <FETLogo size="lg" showTagline={false} />
      </div>

      {/* Fine Border Inset */}
      <div className="absolute inset-1.5 rounded-[18px] sm:rounded-[22px] border border-slate-200 pointer-events-none" />

      {/* ========================================================================= */}
      {/* FRONT SIDE VIEW                                                           */}
      {/* ========================================================================= */}
      {!isFlipped ? (
        <div className="relative z-10 flex flex-col justify-between h-full p-3.5 sm:p-4.5">
          
          {/* Top Brand Header Bar */}
          <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between gap-2">
            
            {/* Trust Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                <FETLogo size="sm" showTagline={false} />
              </div>

              <div>
                <h3 className="text-[10px] sm:text-xs font-black text-slate-900 tracking-wide uppercase leading-tight font-serif">
                  {themeConfig.headerTitle}
                </h3>
                <p className="text-[7.5px] sm:text-[9px] text-emerald-800 font-bold font-serif leading-tight">
                  Minar-ul-Zulmat Ila-Noor
                </p>
              </div>
            </div>

            {/* Category Role Badge */}
            <div className="shrink-0">
              <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 border ${themeConfig.badgeBg} ${themeConfig.badgeBorder}`}>
                <CategoryIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{themeConfig.shortLabel}</span>
              </span>
            </div>
          </div>

          {/* Center Identity Grid (Photo | Metadata | QR Code) */}
          <div className="py-1 grid grid-cols-12 gap-2 sm:gap-3 items-center flex-1">
            
            {/* Left Photo & Signatory Box */}
            <div className="col-span-3 flex flex-col items-center justify-center">
              <div className="w-14 h-16 sm:w-18 sm:h-22 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border-2 border-slate-300 relative flex items-center justify-center bg-slate-100">
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt={fullName} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-1">
                    <span className="font-black text-lg sm:text-2xl text-slate-400">
                      {fullName ? fullName.charAt(0).toUpperCase() : 'M'}
                    </span>
                    <span className="text-[6px] font-mono text-slate-400 uppercase tracking-tighter">PHOTO</span>
                  </div>
                )}
              </div>

              {/* Authorised Signatory below Photo */}
              <div className="text-center mt-1 w-full">
                <div className="font-serif italic text-[8px] sm:text-[9.5px] text-slate-700 font-bold leading-none select-none tracking-tight">
                  Fatimyah Trust
                </div>
                <div className="w-14 sm:w-16 h-px bg-slate-400 my-0.5 mx-auto" />
                <span className="text-[5.5px] sm:text-[6.5px] uppercase font-bold text-slate-500 block leading-tight">
                  Authorised Signatory
                </span>
              </div>
            </div>

            {/* Center Data Column */}
            <div className="col-span-6 space-y-1 pl-0.5 text-[8px] sm:text-[9.5px]">
              
              {/* Member Full Name */}
              <div>
                <span className="text-[6.5px] sm:text-[7.5px] uppercase font-bold text-slate-500 tracking-wider block">
                  Name
                </span>
                <div className="text-[11px] sm:text-sm font-black text-slate-950 leading-tight truncate uppercase" title={fullName}>
                  {fullName || 'REGISTERED INDIVIDUAL'}
                </div>
                {parentName && (
                  <div className="text-[7px] sm:text-[8.5px] text-slate-600 truncate mt-0.5">
                    <span className="font-bold text-slate-500">{parentPrefix}:</span> <span className="font-semibold text-slate-800">{parentName}</span>
                  </div>
                )}
              </div>

              {/* ID Row */}
              <div>
                <span className="text-[6.5px] sm:text-[7.5px] uppercase font-bold text-slate-500 block">
                  {themeConfig.idLabel}
                </span>
                <span className={`font-mono font-black tracking-tight block text-[9.5px] sm:text-[11px] ${themeConfig.idText}`}>
                  {cardId}
                </span>
              </div>

              {/* Join Date & Extra Field Grid */}
              <div className="grid grid-cols-2 gap-1 text-[7.5px] sm:text-[9px]">
                <div>
                  <span className="text-[6px] sm:text-[7px] uppercase font-bold text-slate-500 block">
                    Join Date
                  </span>
                  <span className="font-bold text-slate-800 block">
                    {formattedIssueDate}
                  </span>
                </div>

                <div>
                  <span className="text-[6px] sm:text-[7px] uppercase font-bold text-slate-500 block">
                    {themeConfig.extraLabel}
                  </span>
                  <span className="font-bold text-slate-800 block truncate">
                    {themeConfig.extraValue}
                  </span>
                </div>
              </div>

              {/* Valid Till */}
              <div>
                <span className="text-[6px] sm:text-[7px] uppercase font-bold text-slate-500 block">
                  Valid Till
                </span>
                <span className="font-black text-slate-900 block text-[8px] sm:text-[9.5px]">
                  {validUntil}
                </span>
              </div>

            </div>

            {/* Right Column: Dynamic Live QR Code */}
            <div className="col-span-3 flex flex-col items-center justify-center h-full">
              <div 
                onClick={handleVerificationClick}
                className="p-1 sm:p-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 shadow-xs cursor-pointer hover:scale-105 transition-transform flex flex-col items-center"
                title="Click or Scan to Verify Credential"
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center">
                  <QRCodeSVG 
                    value={verifyUrl}
                    size={56}
                    level="M"
                    includeMargin={false}
                    className="w-full h-full"
                  />
                </div>
                <span className="text-[5.5px] sm:text-[6.5px] font-mono font-black text-slate-700 mt-0.5 tracking-tighter flex items-center gap-0.5">
                  <Shield className="w-1.5 h-1.5 text-emerald-700 inline" /> SCAN TO VERIFY
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Slogan Ribbon */}
          <div className={`-mx-3.5 -mb-3.5 sm:-mx-4.5 sm:-mb-4.5 py-1 px-3 flex items-center justify-between text-[7px] sm:text-[8.5px] font-bold text-white shadow-inner ${themeConfig.ribbonBg}`}>
            <span className="tracking-wider uppercase font-black">
              {themeConfig.slogan}
            </span>
            <span className="font-mono text-[6.5px] sm:text-[7.5px] opacity-90 hidden sm:inline">
              {config.websiteUrl || 'www.fetindia.com'}
            </span>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* BACK SIDE VIEW                                                            */
        /* ========================================================================= */
        <div className="relative z-10 flex flex-col justify-between h-full p-3.5 sm:p-4.5 text-xs bg-white">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center">
                <FETLogo size="xs" showTagline={false} />
              </div>
              <div>
                <h4 className="font-black text-[9px] sm:text-[10.5px] text-slate-900 uppercase tracking-wide leading-tight">
                  FATIMYAH EDUCATIONAL TRUST
                </h4>
                <p className="text-[6.5px] sm:text-[7.5px] text-emerald-800 font-bold">
                  Minar-ul-Zulmat Ila-Noor
                </p>
              </div>
            </div>
            <span className={`text-[7px] sm:text-[8px] font-mono font-black ${themeConfig.idText}`}>
              SERIAL: {cardId}
            </span>
          </div>

          {/* Guidelines & Terms (Matching Reference Image 3) */}
          <div className="py-1 space-y-1.5 text-[6.5px] sm:text-[8px] text-slate-700 leading-snug">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold shrink-0">📍</span>
              <p>
                This ID card is the official property of <strong>Fatimyah Educational Trust</strong>.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold shrink-0">🔘</span>
              <p>
                This card is strictly non-transferable.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold shrink-0">🏢</span>
              <p>
                If found, please return to the nearest FET office.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold shrink-0">⚖️</span>
              <p>
                Use of this card is governed by the rules of the Trust.
              </p>
            </div>
          </div>

          {/* Contact Coordinates Box */}
          <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-[6.5px] sm:text-[7.5px] text-slate-600">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 font-semibold text-slate-800">
                <span>🌐</span> <span>{config.websiteUrl || 'www.fetindia.com'}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <span>✉️</span> <span>{config.contactEmail || 'info@fetindia.com'}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <span>📞</span> <span>{config.contactPhone || '+91 123 456 7890'}</span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <FETLogo size="xs" showTagline={false} />
              <span className="text-[6px] sm:text-[7px] font-black text-slate-800 uppercase mt-0.5">
                FATIMYAH EDUCATIONAL TRUST
              </span>
              <span className="text-[5.5px] sm:text-[6px] text-emerald-800 font-bold">
                Minar-ul-Zulmat Ila-Noor
              </span>
            </div>
          </div>

          {/* Bottom Back Ribbon */}
          <div className={`-mx-3.5 -mb-3.5 sm:-mx-4.5 sm:-mb-4.5 py-1 px-3 flex items-center justify-between text-[6.5px] sm:text-[7.5px] font-bold text-white ${themeConfig.ribbonBg}`}>
            <span>FATIMYAH EDUCATIONAL TRUST • INDIA</span>
            <span className="font-mono opacity-90 uppercase">OFFICIAL ACCREDITED CREDENTIAL</span>
          </div>

        </div>
      )}
    </div>
  );
};
