/**
 * @license
 * Official FET India Logo Component
 * Incorporating the 3 Primary Brand Colors:
 * 1. Deep Islamic Emerald Green (#0D6E42) - Growth, Faith, Education
 * 2. Royal Navy Sapphire Blue (#0B2545) - Trust, Governance, Service
 * 3. Sun Gold Amber (#D97706) - Empowerment, Knowledge, Charity
 */

import React, { useState } from 'react';
import { useConfig } from '../../contexts/ConfigContext';

interface FETLogoProps {
  variant?: 'full' | 'emblem' | 'compact' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  hideBadge?: boolean;
  className?: string;
}

export const FETLogo: React.FC<FETLogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = true,
  hideBadge = false,
  className = ''
}) => {
  const { config } = useConfig();
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    xs: { emblem: 22, textTitle: 'text-xs font-bold', textSub: 'text-[9px]' },
    sm: { emblem: 34, textTitle: 'text-sm font-bold', textSub: 'text-[10px]' },
    md: { emblem: 46, textTitle: 'text-base sm:text-lg font-bold tracking-tight', textSub: 'text-[11px]' },
    lg: { emblem: 60, textTitle: 'text-xl sm:text-2xl font-bold tracking-tight', textSub: 'text-xs' },
    xl: { emblem: 76, textTitle: 'text-2xl sm:text-3xl font-extrabold tracking-tight', textSub: 'text-sm' }
  }[size] || { emblem: 46, textTitle: 'text-base sm:text-lg font-bold tracking-tight', textSub: 'text-[11px]' };

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  const CustomOrSvgEmblem = (config.logoUrl && !imgError) ? (
    <img
      src={config.logoUrl}
      alt={config.displayName || 'FET India Logo'}
      width={dimensions.emblem}
      height={dimensions.emblem}
      onError={() => setImgError(true)}
      className="shrink-0 object-contain rounded-xl shadow-xs transition-transform duration-300 hover:scale-105 fet-logo-subtle-motion"
      referrerPolicy="no-referrer"
      id="fet-official-custom-logo-img"
    />
  ) : (
    <svg
      width={dimensions.emblem}
      height={dimensions.emblem}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 hover:scale-105 filter drop-shadow-xs fet-logo-subtle-motion"
      id="fet-official-emblem"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryBlue} />
          <stop offset="100%" stopColor="#061527" />
        </linearGradient>
        <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryGreen} />
          <stop offset="100%" stopColor="#08492c" />
        </linearGradient>
        <radialGradient id="sunburstGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
          <stop offset="100%" stopColor={accentAmber} stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Outer Royal Shield with Gold Trim */}
      <circle cx="60" cy="60" r="56" fill="url(#shieldGrad)" />
      <circle cx="60" cy="60" r="52" stroke={accentAmber} strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="60" cy="60" r="47" fill="url(#innerGrad)" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.2" />

      {/* Sunburst Rays of Guidance */}
      <circle cx="60" cy="60" r="38" fill="url(#sunburstGrad)" />
      <g stroke={accentAmber} strokeWidth="1.75" strokeLinecap="round" opacity="0.9">
        <line x1="60" y1="16" x2="60" y2="24" />
        <line x1="60" y1="96" x2="60" y2="104" />
        <line x1="16" y1="60" x2="24" y2="60" />
        <line x1="96" y1="60" x2="104" y2="60" />
        <line x1="29" y1="29" x2="35" y2="35" />
        <line x1="85" y1="85" x2="91" y2="91" />
        <line x1="29" y1="91" x2="35" y2="85" />
        <line x1="85" y1="35" x2="91" y2="29" />
      </g>

      {/* Arch of Knowledge & Heritage */}
      <path
        d="M 36 78 C 36 44, 84 44, 84 78"
        stroke={accentAmber}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Book of Knowledge (Quran / Educational Open Book) */}
      <path
        d="M 60 62 C 50 56, 42 58, 38 64 L 38 82 C 43 78, 51 78, 60 84 C 69 78, 77 78, 82 82 L 82 64 C 78 58, 70 56, 60 62 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 60 62 L 60 84"
        stroke={primaryBlue}
        strokeWidth="2.5"
      />
      <path
        d="M 43 68 C 47 67, 51 67, 56 70"
        stroke={primaryGreen}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 77 68 C 73 67, 69 67, 64 70"
        stroke={primaryGreen}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Torch of Enlightenment */}
      <path
        d="M 60 38 C 55 46, 60 52, 60 56 C 60 52, 65 46, 60 38 Z"
        fill={accentAmber}
      />
      <circle cx="60" cy="46" r="2.2" fill="#FFFBEB" />

      {/* Star of Excellence */}
      <polygon
        points="60,24 62.5,29.5 68,30.5 64,34.5 65,40 60,37 55,40 56,34.5 52,30.5 57.5,29.5"
        fill={accentAmber}
      />
    </svg>
  );

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center ${className}`} id="fet-logo-emblem-wrapper">
        {CustomOrSvgEmblem}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 sm:gap-2.5 max-w-full ${className}`} id="fet-logo-compact-wrapper">
        {CustomOrSvgEmblem}
        <div className="flex flex-col justify-center select-none text-left min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base leading-tight truncate">
              {config.displayName || 'Fatimyah Educational Trust'}
            </span>
            {!hideBadge && (
              <span 
                className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider text-white shadow-2xs shrink-0"
                style={{ backgroundColor: primaryGreen }}
              >
                {config.shortBrand || 'FET India'}
              </span>
            )}
          </div>
          {showTagline && (
            <span 
              className="text-[10px] font-semibold tracking-wider uppercase text-emerald-800 opacity-90 truncate leading-none mt-0.5"
            >
              {config.tagline || 'Education • Service • Empowerment'}
            </span>
          )}
        </div>
      </div>
    );
  }

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-2 sm:gap-3 max-w-full ${className}`} id="fet-logo-full-wrapper">
      {CustomOrSvgEmblem}
      <div className="flex flex-col justify-center select-none text-left min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className={`tracking-tight truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none ${isLight ? 'text-white' : 'text-slate-900'} ${dimensions.textTitle}`}>
            {size === 'sm' || size === 'xs' ? (
              <>
                <span className="inline sm:hidden">{config.shortBrand || 'FET India'}</span>
                <span className="hidden sm:inline">{config.displayName || 'Fatimyah Educational Trust'}</span>
              </>
            ) : (
              config.displayName || 'Fatimyah Educational Trust'
            )}
          </span>
          {!hideBadge && (
            <span 
              className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryGreen }}
            >
              {config.shortBrand || 'FET India'}
            </span>
          )}
        </div>
        {showTagline && (
          <span 
            className={`font-semibold tracking-wider uppercase truncate max-w-[160px] xs:max-w-[200px] sm:max-w-none ${isLight ? 'text-amber-300 opacity-90' : 'text-emerald-800 opacity-90'} ${dimensions.textSub}`}
          >
            {config.tagline || 'Education • Service • Empowerment'}
          </span>
        )}
      </div>
    </div>
  );
};

