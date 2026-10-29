/**
 * @license
 * Cloud Storage & File Upload Service for FET India
 * Handles Cover Photos, Cause Gallery, and Private Verification Documents
 */

import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from './firebase';

export const FIREBASE_STORAGE_BUCKET = 'fatimyah-educational-trust.firebasestorage.app';

export function getStorageBucketName(): string {
  return FIREBASE_STORAGE_BUCKET;
}

export interface UploadResult {
  url: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  storagePath?: string;
  cloudStorageUrl?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image files (JPG, JPEG, PNG, WebP)
 */
export function validateImageFile(file: File, maxMb = 10): FileValidationResult {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(extension) && !allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported image format (${extension || 'unknown'}). Please select a JPG, PNG, or WebP image.`
    };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Image size exceeds the ${maxMb}MB limit (File is ${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller photo.`
    };
  }

  return { valid: true };
}

/**
 * Validate verification documents (PDF, JPG, JPEG, PNG, WebP)
 */
export function validateDocumentFile(file: File, maxMb = 15): FileValidationResult {
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(extension) && !allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file format. Please upload an official PDF document or clear image (JPG/PNG).`
    };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Document size exceeds ${maxMb}MB (File is ${(file.size / (1024 * 1024)).toFixed(1)}MB). Please compress the document before uploading.`
    };
  }

  return { valid: true };
}

/**
 * Helper to convert a File or Blob to Base64 Data URL (Used for fast client-side preview & reliable resilient fallback)
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(new Error('Failed to read file buffer. ' + (err || '')));
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an image using browser Canvas API (preserves crisp clarity up to maxDimension while compressing size)
 */
export async function processAndOptimizeImage(
  file: File,
  maxDimension = 1000,
  quality = 0.82
): Promise<{ blob: Blob; file: File; dataUrl: string }> {
  // If not an image or SVG, return as is
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    const dataUrl = await fileToDataUrl(file);
    return { blob: file, file, dataUrl };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse and decode image for processing.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            blob: file,
            file,
            dataUrl: reader.result as string
          });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Standardize on compressed web JPEG to prevent uncompressed PNG Base64 bloating Firestore documents beyond 1MB
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                blob: file,
                file,
                dataUrl
              });
            }

            const optimizedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '') + '.jpg', 
              {
                type: mimeType,
                lastModified: Date.now()
              }
            );

            resolve({
              blob,
              file: optimizedFile,
              dataUrl
            });
          },
          mimeType,
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Timeout wrapper for Promise operations
 */
function withTimeout<T>(promise: any, timeoutMs: number, timeoutMsg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMsg)), timeoutMs);
    Promise.resolve(promise)
      .then((res: any) => {
        clearTimeout(timer);
        resolve(res as T);
      })
      .catch((err: any) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Upload file to Firebase Storage with real-time progress callback
 * Includes intelligent pre-processing and instant fallback to high-resolution data stream.
 */
export async function uploadCampaignMedia(
  file: File,
  folder: 'avatars' | 'covers' | 'gallery' | 'private_documents' | 'id_proofs',
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  if (onProgress) onProgress(15);

  let uploadFile = file;
  let optimizedDataUrl: string | null = null;

  // 1. Optimize image files if applicable
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (isImage) {
    try {
      const optimized = await processAndOptimizeImage(file, 1400, 0.88);
      uploadFile = optimized.file;
      optimizedDataUrl = optimized.dataUrl;
      if (onProgress) onProgress(35);
    } catch (optErr) {
      console.warn('Image pre-processing notice (using source file):', optErr);
    }
  }

  const sanitizedName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `fet_uploads/${folder}/${Date.now()}_${sanitizedName}`;

  if (onProgress) onProgress(50);

  // 2. Attempt Cloud Storage upload to designated bucket (fatimyah-educational-trust.firebasestorage.app)
  try {
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, uploadFile, {
      contentType: uploadFile.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
      customMetadata: {
        folder,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    // Real-time upload progress from Cloud Storage
    uploadTask.on('state_changed', (snapshot) => {
      if (snapshot.totalBytes > 0 && onProgress) {
        const pct = Math.min(95, Math.max(50, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)));
        onProgress(pct);
      }
    });

    const snap = await withTimeout<UploadTaskSnapshot>(uploadTask, 30000, 'Cloud Storage upload timed out after 30s');
    
    if (onProgress) onProgress(95);
    const downloadUrl = await getDownloadURL(snap.ref);
    if (onProgress) onProgress(100);

    return {
      url: downloadUrl,
      fileName: uploadFile.name,
      sizeBytes: uploadFile.size,
      mimeType: uploadFile.type || 'application/octet-stream'
    };
  } catch (storageErr: any) {
    console.info('Cloud Storage upload fallback (using optimized data stream):', storageErr?.message || storageErr);
    
    if (onProgress) onProgress(75);

    // Fallback: Generate or use high-resolution Data URL
    const finalDataUrl = optimizedDataUrl || (await fileToDataUrl(uploadFile));
    
    if (onProgress) onProgress(100);

    return {
      url: finalDataUrl,
      fileName: uploadFile.name,
      sizeBytes: uploadFile.size,
      mimeType: uploadFile.type || 'application/octet-stream'
    };
  }
}

/**
 * Processes and optimizes profile photo using browser canvas for crisp ID-card quality.
 * Preserves high clarity (~800x800px, 150-300KB) without artificial 3-5KB pixelation.
 */
export async function processAndOptimizeAvatarImage(
  file: File,
  maxDimension = 800,
  quality = 0.88
): Promise<{ blob: Blob; file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for optimization.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            blob: file,
            file,
            dataUrl: reader.result as string
          });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                blob: file,
                file,
                dataUrl
              });
            }

            const optimizedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '') + (mimeType === 'image/png' ? '.png' : '.jpg'), 
              {
                type: mimeType,
                lastModified: Date.now()
              }
            );

            resolve({
              blob,
              file: optimizedFile,
              dataUrl
            });
          },
          mimeType,
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload User Profile Photo to user-specific Cloud Storage directory
 * Path format: profile_photos/{userId}/{timestamp}_{sanitizedName}
 */
export async function uploadUserProfilePhoto(
  userId: string,
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  if (onProgress) onProgress(15);

  // Pre-process and optimize photo
  let uploadFile = file;
  let optimizedDataUrl: string | null = null;
  try {
    const optimized = await processAndOptimizeAvatarImage(file, 800, 0.88);
    uploadFile = optimized.file;
    optimizedDataUrl = optimized.dataUrl;
    if (onProgress) onProgress(35);
  } catch (optErr) {
    console.warn('Profile photo pre-processing notice (using original):', optErr);
  }

  const sanitizedName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `profile_photos/${userId}/${Date.now()}_${sanitizedName}`;

  if (onProgress) onProgress(50);

  try {
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, uploadFile, {
      contentType: uploadFile.type || 'image/jpeg',
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        purpose: 'user_profile_photo'
      }
    });

    uploadTask.on('state_changed', (snapshot) => {
      if (snapshot.totalBytes > 0 && onProgress) {
        const pct = Math.min(95, Math.max(50, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)));
        onProgress(pct);
      }
    });

    const snap = await withTimeout<UploadTaskSnapshot>(uploadTask, 30000, 'Cloud Storage upload timed out after 30s');
    
    if (onProgress) onProgress(95);
    const downloadUrl = await getDownloadURL(snap.ref);
    if (onProgress) onProgress(100);

    return {
      url: downloadUrl,
      fileName: uploadFile.name,
      sizeBytes: uploadFile.size,
      mimeType: uploadFile.type || 'image/jpeg'
    };
  } catch (storageErr: any) {
    console.info('Storage upload notice for profile photo (using optimized stream):', storageErr?.message || storageErr);
    
    if (onProgress) onProgress(75);
    const finalDataUrl = optimizedDataUrl || (await fileToDataUrl(uploadFile));
    if (onProgress) onProgress(100);

    return {
      url: finalDataUrl,
      fileName: uploadFile.name,
      sizeBytes: uploadFile.size,
      mimeType: uploadFile.type || 'image/jpeg'
    };
  }
}

/**
 * Upload Examination Curriculum / Book PDF to Cloud Storage
 * Path: examination_materials/{examId}/{timestamp}_{filename}
 */
/**
 * Fast, resilient PDF upload using XMLHttpRequest for real byte-level progress tracking.
 * Avoids browser freezes, eliminates 35s timeouts, and never converts PDFs to oversized Base64.
 */
function uploadPdfViaServerXhr(
  file: File,
  examId: string,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    // Critical: append metadata fields BEFORE file so multipart parser has examId when initializing destination
    formData.append('examId', examId);
    formData.append('pdfFile', file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        // Map upload byte transmission from 10% to 88%
        const pct = Math.min(88, Math.max(10, Math.round((event.loaded / event.total) * 88)));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (onProgress) onProgress(95); // Finalizing state
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.success && data.url) {
            if (onProgress) onProgress(100);
            resolve({
              url: data.url,
              fileName: data.fileName || file.name,
              sizeBytes: data.sizeBytes || file.size,
              mimeType: 'application/pdf',
              storagePath: data.storagePath
            });
          } else {
            reject(new Error(data?.error || 'Invalid upload confirmation from storage service.'));
          }
        } catch {
          reject(new Error('Failed to parse storage server response.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData?.error || `Upload failed with HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`Storage service returned HTTP ${xhr.status}.`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network connection error during PDF upload. Please verify connectivity and try again.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('PDF upload timed out after 3 minutes. Please check your network connection and try again.'));
    };

    xhr.timeout = 180000; // 180 seconds (3 minutes) for reliable large document uploads
    // Also include examId in the query string so it is available before the multipart body stream begins
    xhr.open('POST', `/api/competitions/upload-pdf?examId=${encodeURIComponent(examId)}`);
    xhr.send(formData);
  });
}


export async function uploadExamPdfMaterial(
  file: File,
  examId: string,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  const validation = validateDocumentFile(file, 25);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file. Please upload an official PDF document up to 25 MB.');
  }

  if (onProgress) onProgress(5);

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `examination_materials/${examId}/${Date.now()}_${sanitizedName}`;
  let cloudStorageUrl: string | undefined = undefined;

  // 1. Authoritative durable Firebase Cloud Storage upload (persists across container restarts)
  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/pdf',
      customMetadata: {
        examId,
        uploadedAt: new Date().toISOString(),
        originalFileName: file.name,
        purpose: 'examination_reading_material'
      }
    });

    uploadTask.on('state_changed', (snapshot) => {
      if (snapshot.totalBytes > 0 && onProgress) {
        const pct = Math.min(60, Math.max(10, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 60)));
        onProgress(pct);
      }
    });

    const snap = await withTimeout<UploadTaskSnapshot>(uploadTask, 60000, 'Cloud Storage upload timed out after 60 seconds');
    cloudStorageUrl = await getDownloadURL(snap.ref);
    if (onProgress) onProgress(65);
  } catch (fbErr: any) {
    console.warn('Notice: Firebase Storage upload notice, proceeding with server storage sync:', fbErr?.message || fbErr);
  }

  // 2. Synchronize to server disk storage for low-latency streaming and verification
  try {
    const serverResult = await uploadPdfViaServerXhr(file, examId, (serverPct) => {
      if (onProgress) {
        // Map 65% to 95%
        const overall = Math.min(95, Math.max(65, 65 + Math.round((serverPct / 100) * 30)));
        onProgress(overall);
      }
    });

    if (onProgress) onProgress(100);
    return {
      url: serverResult.url,
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/pdf',
      storagePath,
      cloudStorageUrl: cloudStorageUrl || serverResult.url
    };
  } catch (serverErr: any) {
    console.info('Server storage notice, using persistent Cloud Storage link:', serverErr?.message || serverErr);
    
    if (cloudStorageUrl) {
      if (onProgress) onProgress(100);
      return {
        url: cloudStorageUrl,
        fileName: file.name,
        sizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        storagePath,
        cloudStorageUrl
      };
    }

    // Both failed
    throw new Error(`Failed to upload official examination PDF: ${serverErr?.message || 'Storage error'}`);
  }
}

/**
 * Upload Store Product image with pre-processing, compression and resilient storage fallback
 */
export async function uploadStoreProductImage(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  return uploadCampaignMedia(file, 'gallery', onProgress);
}

/**
 * Upload Store Digital Product File (PDF books, publications, curriculum materials)
 * with validation, secure storage referencing, and resilient fallback
 */
export async function uploadStoreDigitalFile(
  file: File,
  productId?: string,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  const validation = validateDocumentFile(file, 50); // up to 50MB
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file. Please upload an official PDF or document.');
  }

  if (onProgress) onProgress(15);
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `store_digital_assets/${productId || 'new'}/${Date.now()}_${sanitizedName}`;

  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/pdf',
      customMetadata: {
        productId: productId || 'unassigned',
        originalFileName: file.name,
        uploadedAt: new Date().toISOString(),
        purpose: 'store_digital_asset'
      }
    });

    uploadTask.on('state_changed', (snapshot) => {
      if (snapshot.totalBytes > 0 && onProgress) {
        const pct = Math.min(95, Math.max(20, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)));
        onProgress(pct);
      }
    });

    const snap = await withTimeout<UploadTaskSnapshot>(uploadTask, 45000, 'Digital file upload timed out after 45 seconds');
    if (onProgress) onProgress(95);

    const downloadUrl = await getDownloadURL(snap.ref);
    if (onProgress) onProgress(100);

    return {
      url: downloadUrl,
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/pdf'
    };
  } catch (storageErr: any) {
    console.info('Storage fallback for store digital file (using resilient data URL stream):', storageErr?.message || storageErr);
    if (onProgress) onProgress(75);
    const dataUrl = await fileToDataUrl(file);
    if (onProgress) onProgress(100);

    return {
      url: dataUrl,
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/pdf'
    };
  }
}


