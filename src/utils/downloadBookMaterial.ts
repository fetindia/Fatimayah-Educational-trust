/**
 * @license
 * Multi-Device Universal Book Download Service for FET India
 * Fatimyah Educational Trust India (Education • Service • Empowerment)
 *
 * Robustly handles book and study-material downloads across:
 * - iOS Safari (iPhone / iPad) - eliminates programmatic click blocking
 * - Android Chrome - prevents premature blob object URL revocation
 * - Desktop browsers (Chrome, Edge, Firefox, Safari)
 * - Candidate eligibility & registration verification
 * - Seamless fallback between Cloud Storage, Server Proxy, and Direct URLs
 */

import { Competition, CompetitionRegistration } from '../types';

export interface CandidateAuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: string;
  primaryRole?: string;
  roles?: string[];
}

export interface DownloadBookOptions {
  competition: Competition;
  currentUser?: CandidateAuthUser | null;
  userRegistration?: CompetitionRegistration | null;
  onStart?: () => void;
  onProgress?: (progressPercent: number) => void;
  onSuccess?: (fileName: string) => void;
  onError?: (error: Error, isAuthError?: boolean) => void;
  onAuthRequired?: (reason: string, mode: 'login' | 'register' | 'pay') => void;
}

export interface DeviceEnvironment {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isSafari: boolean;
}

export function detectDeviceEnvironment(): DeviceEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIOS: false, isAndroid: false, isMobile: false, isSafari: false };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi|Opera Mini/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  return { isIOS, isAndroid, isMobile, isSafari };
}

/**
 * Check if the competition allows open/public book downloads
 */
export function isPublicBookDownloadAllowed(competition: Competition): boolean {
  if (!competition) return false;
  
  // Explicitly marked public in bookDetails or competition root
  if (competition.bookDetails?.isPublic || (competition as any).allowPublicBookDownload) {
    return true;
  }

  // Free competition with no mandatory registration barrier for curriculum reading
  if (!competition.isPaid && (competition.participationFee ?? 0) === 0) {
    return true;
  }

  return false;
}

/**
 * Resolve the optimal download URL for a competition
 */
export function resolveBookDownloadUrl(
  competition: Competition,
  currentUser?: CandidateAuthUser | null,
  userRegistration?: CompetitionRegistration | null
): { url: string; isServerProxy: boolean; fileName: string } {
  const compId = competition.id || competition.code || 'general';
  const rawFileName =
    competition.pdfFileName ||
    competition.bookDetails?.pdfFileName ||
    `${competition.code || 'FET'}_Study_Material.pdf`;
  const safeFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  const uid = currentUser?.uid || '';
  const regId = userRegistration?.id || userRegistration?.registrationId || (uid ? `reg-${compId}-${uid}` : '');
  const prtId = userRegistration?.participantId || '';
  const payStatus =
    userRegistration?.paymentStatus ||
    (userRegistration?.isPaid ? 'paid' : (competition.isPaid ? 'pending' : 'free'));

  const cloudStorageUrl =
    (competition as any).pdfCloudStorageUrl ||
    competition.bookDetails?.pdfCloudStorageUrl;

  const rawUrl =
    competition.pdfReadingMaterialUrl ||
    competition.bookDetails?.pdfReadingMaterialUrl ||
    competition.bookDetails?.pdfExternalUrl ||
    (competition as any).pdfExternalUrl;

  // If server proxy is preferred or required for access control:
  const serverProxyUrl = `/api/competitions/${encodeURIComponent(compId)}/material?uid=${encodeURIComponent(
    uid
  )}&regId=${encodeURIComponent(regId)}&prtId=${encodeURIComponent(prtId)}&payStatus=${encodeURIComponent(
    payStatus
  )}&download=1`;

  // If we have a direct durable Cloud Storage URL and the competition is public/free:
  if (cloudStorageUrl && isPublicBookDownloadAllowed(competition)) {
    return { url: cloudStorageUrl, isServerProxy: false, fileName: safeFileName };
  }

  // If rawUrl is an external link (like google drive, s3, or cloud storage) and public:
  if (
    rawUrl &&
    (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
    !rawUrl.includes('/api/competitions/') &&
    isPublicBookDownloadAllowed(competition)
  ) {
    return { url: rawUrl, isServerProxy: false, fileName: safeFileName };
  }

  // Otherwise, use authoritative server proxy which checks access and streams with attachment headers
  return { url: serverProxyUrl, isServerProxy: true, fileName: safeFileName };
}

/**
 * Primary universal download function
 */
export async function downloadCompetitionBook(options: DownloadBookOptions): Promise<void> {
  const {
    competition,
    currentUser,
    userRegistration,
    onStart,
    onProgress,
    onSuccess,
    onError,
    onAuthRequired
  } = options;

  if (onStart) onStart();

  try {
    const isPublic = isPublicBookDownloadAllowed(competition);
    const hasAdminAccess =
      currentUser &&
      (currentUser.role === 'super_admin' ||
        currentUser.role === 'administrator' ||
        currentUser.role === 'exam_controller' ||
        currentUser.role === 'exam_admin' ||
        currentUser.primaryRole === 'super_admin' ||
        (Array.isArray(currentUser.roles) &&
          currentUser.roles.some((r) => ['super_admin', 'administrator', 'exam_controller'].includes(r))));

    // Access control verification
    if (!isPublic && !hasAdminAccess) {
      if (!currentUser) {
        const msg = 'Candidate login is required to download official competition study material.';
        if (onAuthRequired) onAuthRequired(msg, 'login');
        if (onError) onError(new Error(msg), true);
        return;
      }

      if (!userRegistration) {
        const msg = 'Registration is required to access the official study material for this examination.';
        if (onAuthRequired) onAuthRequired(msg, 'register');
        if (onError) onError(new Error(msg), true);
        return;
      }

      if (
        competition.isPaid &&
        (competition.participationFee ?? 0) > 0 &&
        userRegistration.paymentStatus !== 'paid' &&
        userRegistration.paymentStatus !== 'free' &&
        userRegistration.paymentStatus !== 'waived_scholarship'
      ) {
        const msg = 'Participation fee payment verification is required to download the official book.';
        if (onAuthRequired) onAuthRequired(msg, 'pay');
        if (onError) onError(new Error(msg), true);
        return;
      }
    }

    const { url, isServerProxy, fileName } = resolveBookDownloadUrl(
      competition,
      currentUser,
      userRegistration
    );
    const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const env = detectDeviceEnvironment();

    if (onProgress) onProgress(20);

    // 1. MOBILE BROWSERS (iOS Safari & Android Chrome):
    if (env.isMobile) {
      if (onProgress) onProgress(40);

      // If it's a data URL, we use standard link click
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (onProgress) onProgress(100);
        if (onSuccess) onSuccess(finalFileName);
        return;
      }

      // Verify the stream first so mobile users never download JSON/HTML errors as corrupt .pdf files
      try {
        const checkResp = await fetch(url, {
          headers: currentUser
            ? {
                'x-user-uid': currentUser.uid,
                'x-registration-id': userRegistration?.id || '',
                'x-payment-status': userRegistration?.paymentStatus || ''
              }
            : {}
        });

        if (!checkResp.ok) {
          const errData = await checkResp.json().catch(() => null);
          const msg = errData?.error || (checkResp.status === 404 
            ? 'Official study material document is currently not available for this competition.' 
            : `Download failed with status ${checkResp.status}`);
          if (checkResp.status === 403 && onAuthRequired) {
            onAuthRequired(msg, 'register');
          }
          throw new Error(msg);
        }

        const contentType = checkResp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await checkResp.json().catch(() => null);
          throw new Error(json?.error || 'Server returned an invalid document response.');
        }

        if (onProgress) onProgress(80);
        const blob = await checkResp.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const mobileLink = document.createElement('a');
        mobileLink.href = blobUrl;
        mobileLink.download = finalFileName;
        document.body.appendChild(mobileLink);
        mobileLink.click();
        setTimeout(() => {
          try {
            document.body.removeChild(mobileLink);
            window.URL.revokeObjectURL(blobUrl);
          } catch {}
        }, 15000);

        if (onProgress) onProgress(100);
        if (onSuccess) onSuccess(finalFileName);
        return;
      } catch (mobileErr: any) {
        if (mobileErr.message && !mobileErr.message.includes('Failed to fetch')) {
          throw mobileErr;
        }
        // If fetch was blocked by strict CORS on an external direct link, fallback to direct open
        const fallbackLink = document.createElement('a');
        fallbackLink.href = url;
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';
        fallbackLink.download = finalFileName;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        setTimeout(() => {
          try {
            document.body.removeChild(fallbackLink);
          } catch {}
        }, 5000);
        if (onProgress) onProgress(100);
        if (onSuccess) onSuccess(finalFileName);
        return;
      }
    }

    // 2. DESKTOP BROWSERS:
    // Fetch blob with accurate progress tracking, then save with long-lived object URL
    if (onProgress) onProgress(40);

    let downloadBlob: Blob | null = null;

    try {
      const resp = await fetch(url, {
        headers: currentUser
          ? {
              'x-user-uid': currentUser.uid,
              'x-registration-id': userRegistration?.id || '',
              'x-payment-status': userRegistration?.paymentStatus || ''
            }
          : {}
      });

      if (!resp.ok) {
        if (resp.status === 403) {
          const errData = await resp.json().catch(() => null);
          const msg = errData?.error || 'Candidate registration verification required to download official book.';
          if (onAuthRequired) onAuthRequired(msg, 'register');
          throw new Error(msg);
        }
        if (resp.status === 404) {
          throw new Error('Official study material document is currently being uploaded or updated by the Examination Board.');
        }
        throw new Error(`Download service returned HTTP ${resp.status}`);
      }

      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await resp.json().catch(() => null);
        if (json?.error) {
          throw new Error(json.error);
        }
      }

      if (onProgress) onProgress(75);
      downloadBlob = await resp.blob();
    } catch (fetchErr: any) {
      // Fallback: If desktop fetch fails due to CORS or network, attempt direct window open
      console.warn('Desktop fetch notice, trying direct browser download:', fetchErr);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = url;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.download = finalFileName;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      setTimeout(() => {
        try {
          document.body.removeChild(fallbackLink);
        } catch {}
      }, 2000);

      if (onProgress) onProgress(100);
      if (onSuccess) onSuccess(finalFileName);
      return;
    }

    if (downloadBlob) {
      if (onProgress) onProgress(90);
      const blobUrl = window.URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Crucial: Keep blob URL alive for at least 60 seconds to prevent prematurely killing download on slower disks
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch {}
      }, 60000);

      if (onProgress) onProgress(100);
      if (onSuccess) onSuccess(finalFileName);
    }
  } catch (err: any) {
    console.error('Error in downloadCompetitionBook:', err);
    if (onError) onError(err);
  }
}
