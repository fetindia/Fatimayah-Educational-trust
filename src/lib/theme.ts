/**
 * @license
 * Centralized Design Tokens & Theme Foundation
 * Fatimyah Educational Trust India (FET India)
 * 
 * Supports dynamic CMS branding across:
 * - Web Platform
 * - Android Mobile App
 * - Future iOS Mobile App
 */

export interface ThemeColorPalette {
  primaryGreen: string;
  primaryBlue: string;
  accentAmber: string;
  backgroundLight: string;
  backgroundDark: string;
  surfaceLight: string;
  surfaceDark: string;
}

export const DEFAULT_THEME_PALETTE: ThemeColorPalette = {
  primaryGreen: '#0D6E42', // FET Emerald Green
  primaryBlue: '#0B2545',  // FET Deep Trust Blue
  accentAmber: '#D97706',  // FET Amber Accent
  backgroundLight: '#FFFFFF',
  backgroundDark: '#0B132B',
  surfaceLight: '#F8FAFC',
  surfaceDark: '#1E293B'
};

export const BRAND_IDENTITY = {
  legalName: 'Fatimyah Educational Trust',
  publicBrand: 'FET India',
  tagline: 'Education • Service • Empowerment',
  establishedYear: 1994,
  officialWebsite: 'https://fetindia.com',
  officialEmail: 'fetkofficial@gmail.com',
  appPackageAndroid: 'org.fetindia.app',
  appBundleIos: 'org.fetindia.app'
};

/**
 * Apply dynamic theme tokens to HTML root document
 */
export function applyThemeTokens(palette: Partial<ThemeColorPalette>) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const green = palette.primaryGreen || DEFAULT_THEME_PALETTE.primaryGreen;
  const blue = palette.primaryBlue || DEFAULT_THEME_PALETTE.primaryBlue;
  const amber = palette.accentAmber || DEFAULT_THEME_PALETTE.accentAmber;

  root.style.setProperty('--color-primary-green', green);
  root.style.setProperty('--color-primary-blue', blue);
  root.style.setProperty('--color-accent-amber', amber);
}
