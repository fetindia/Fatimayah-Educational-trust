/**
 * @license
 * App Foundation & Shared Mobile/Web Bridge
 * Fatimyah Educational Trust India (FET India)
 * 
 * Supports:
 * - Production Web Portal (Desktop, Tablet, Mobile)
 * - Progressive Web App (PWA Standalone Mode)
 * - Android Trusted Web Activity (TWA) / Android Native App Wrapper
 * - Future iOS Application Wrapper
 * 
 * Strict architectural rule:
 * The website, Android application, and iOS application share the EXACT SAME
 * authorized Firebase backend, data models, authentication tokens, and CMS configuration.
 */

import { useState, useEffect } from 'react';
import { 
  ClientPlatformType, 
  DeviceEnvironmentInfo, 
  ParsedDeepLink, 
  DeepLinkTarget,
  MobileAppSettings 
} from '../types';

export const DEFAULT_MOBILE_APP_SETTINGS: MobileAppSettings = {
  appName: 'FET India',
  version: '2.0.0',
  buildNumber: 65,
  minSupportedVersion: '1.0.0',
  forceUpdateRequired: false,
  enablePushNotifications: true,
  enableBiometricLogin: false,
  enableOfflineCache: true,
  androidPackageName: 'org.fetindia.app',
  iosBundleId: 'org.fetindia.app',
  supportEmail: 'fetkofficial@gmail.com',
  privacyPolicyUrl: 'https://fetindia.com/privacy',
  termsOfServiceUrl: 'https://fetindia.com/terms'
};

/**
 * Detect the current client execution environment
 */
export function detectClientPlatform(): ClientPlatformType {
  if (typeof window === 'undefined') {
    return 'web_browser';
  }

  const userAgent = window.navigator.userAgent || '';
  
  // 1. Android TWA or Webview check
  if (
    userAgent.includes('FETIndiaAndroid') || 
    (window as unknown as { isFETAndroidApp?: boolean }).isFETAndroidApp ||
    document.referrer.includes('android-app://org.fetindia.app')
  ) {
    return 'android_twa';
  }

  // 2. iOS App Wrapper check
  if (
    userAgent.includes('FETIndiaIOS') ||
    (window as unknown as { isFETIOSApp?: boolean }).isFETIOSApp
  ) {
    return 'ios_app';
  }

  // 3. Standalone PWA mode (Installed to Home Screen on Android/iOS/Desktop)
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  
  if (isStandalone) {
    return 'pwa_standalone';
  }

  return 'web_browser';
}

/**
 * Retrieve comprehensive device environment information
 */
export function getDeviceEnvironmentInfo(): DeviceEnvironmentInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'web_browser',
      isMobileDevice: false,
      isStandalonePWA: false,
      isOnline: true,
      userAgent: '',
      screenWidth: 1920,
      screenHeight: 1080,
      devicePixelRatio: 1,
      supportsTouch: false,
      supportsWebShare: false,
      supportsPushNotifications: false,
      supportsBiometrics: false
    };
  }

  const platform = detectClientPlatform();
  const userAgent = window.navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isStandalonePWA = platform === 'pwa_standalone';
  const isOnline = window.navigator.onLine ?? true;
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const supportsWebShare = typeof navigator.share === 'function';
  const supportsPushNotifications = 'Notification' in window && 'serviceWorker' in navigator;
  const supportsBiometrics = typeof window.PublicKeyCredential !== 'undefined';

  return {
    platform,
    isMobileDevice: isMobile,
    isStandalonePWA,
    isOnline,
    userAgent,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    supportsTouch,
    supportsWebShare,
    supportsPushNotifications,
    supportsBiometrics
  };
}

/**
 * React Hook for dynamic Network Status monitoring with offline detection
 */
export function useNetworkStatus(): { isOnline: boolean; wasOffline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Display brief recovery notice if user was previously offline
      setWasOffline(true);
      const timer = setTimeout(() => setWasOffline(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Universal Deep Link Parser
 * Parses both custom app schemes (e.g. fetindia://exam/123) and standard web URLs (e.g. https://fetindia.com/exam/123)
 */
export function parseDeepLink(rawUrl: string): ParsedDeepLink {
  try {
    let cleanPath = rawUrl;
    let queryParams: Record<string, string> = {};

    // Standard URL or relative path
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('fetindia://')) {
      const parsed = new URL(rawUrl.replace('fetindia://', 'https://fetindia.com/'));
      cleanPath = parsed.pathname + parsed.hash;
      parsed.searchParams.forEach((val, key) => {
        queryParams[key] = val;
      });
    }

    // Process hash or pathname
    const hash = window.location.hash;
    const effectiveTarget = cleanPath.toLowerCase();

    // 1. Examination / Competition Deep Links
    if (effectiveTarget.includes('/exam/') || effectiveTarget.includes('#exam/')) {
      const parts = cleanPath.split(/exam[s]?[\/]/i);
      const id = parts[1]?.split(/[\?\#\/]/)[0];
      return { target: 'exam', id, queryParams, rawUrl };
    }

    if (effectiveTarget.includes('/competition/') || effectiveTarget.includes('#competition/')) {
      const parts = cleanPath.split(/competition[s]?[\/]/i);
      const id = parts[1]?.split(/[\?\#\/]/)[0];
      return { target: 'competition', id, queryParams, rawUrl };
    }

    // 2. Crowdfunding Deep Link
    if (effectiveTarget.includes('/crowdfunding/') || effectiveTarget.includes('#campaign/') || effectiveTarget.includes('#crowdfunding/')) {
      const parts = cleanPath.split(/(?:crowdfunding|campaign)[\/]/i);
      const id = parts[1]?.split(/[\?\#\/]/)[0];
      return { target: 'crowdfunding', id, queryParams, rawUrl };
    }

    // 3. Event Deep Link
    if (effectiveTarget.includes('/event/') || effectiveTarget.includes('#event/')) {
      const parts = cleanPath.split(/event[s]?[\/]/i);
      const id = parts[1]?.split(/[\?\#\/]/)[0];
      return { target: 'event', id, queryParams, rawUrl };
    }

    // 4. Certificate Verification Deep Link
    if (effectiveTarget.includes('/verify') || effectiveTarget.includes('#verify')) {
      const id = queryParams['id'] || queryParams['cert'] || queryParams['memberId'];
      return { target: 'certificate_verify', id, queryParams, rawUrl };
    }

    // 5. Dashboard & Member Profile
    if (effectiveTarget.includes('/dashboard') || effectiveTarget.includes('#dashboard') || effectiveTarget.includes('/portal')) {
      return { target: 'dashboard', queryParams, rawUrl };
    }

    if (effectiveTarget.includes('/notifications') || effectiveTarget.includes('#notifications')) {
      return { target: 'notifications', queryParams, rawUrl };
    }

    if (effectiveTarget.includes('/donate') || effectiveTarget.includes('#donate')) {
      return { target: 'donate', queryParams, rawUrl };
    }

    if (effectiveTarget.includes('/volunteer') || effectiveTarget.includes('#volunteer')) {
      return { target: 'volunteer', queryParams, rawUrl };
    }

    if (effectiveTarget.includes('/membership') || effectiveTarget.includes('#membership')) {
      return { target: 'membership', queryParams, rawUrl };
    }

    return { target: 'home', queryParams, rawUrl };
  } catch (err) {
    console.warn('[DeepLink] Parse fallback for:', rawUrl, err);
    return { target: 'home', rawUrl };
  }
}

/**
 * Universal Native/Web Share Action
 */
export async function shareContent(shareData: {
  title: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('[Share] Web share notice:', err);
      }
    }
  }

  // Fallback: Copy URL to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && shareData.url) {
    try {
      await navigator.clipboard.writeText(shareData.url);
      return true;
    } catch (clipErr) {
      console.warn('[Share] Clipboard fallback error:', clipErr);
    }
  }

  return false;
}

/**
 * Haptic Feedback trigger for mobile touch interactions
 */
export function triggerHapticFeedback(pattern: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (pattern) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'success':
          navigator.vibrate([15, 30, 15]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
      }
    } catch {
      // Ignored if browser permission denies vibration
    }
  }
}
