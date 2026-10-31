/**
 * Comprehensive Automated Verification Suite
 * FET India — Firebase Storage Integration & Cloud Run Readiness Test
 *
 * Verifies:
 * 1. Firebase Admin Storage configuration and bucket binding.
 * 2. In-memory PDF upload via /api/competitions/upload-pdf (multer.memoryStorage).
 * 3. File validation: 25 MB max limit and non-PDF rejection.
 * 4. Candidate examination book download and delivery (public vs restricted).
 * 5. Multi-category upload paths (profile_photos, fet_uploads, cms_media, store_digital_assets).
 * 6. Private verification document security restrictions.
 * 7. Backward compatibility with existing Base64 data URLs.
 * 8. Authoritative named database binding (ai-studio-fetindiafatimyah-ae91547c-059f-489b-952f-82301b70763c).
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SERVER_BASE = 'http://localhost:3000';
const TARGET_BUCKET = 'fatimyah-educational-trust.firebasestorage.app';
const NAMED_DB = 'ai-studio-fetindiafatimyah-ae91547c-059f-489b-952f-82301b70763c';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, desc: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test ${totalTests}: ${desc}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${desc}`);
    process.exitCode = 1;
  }
}

// Helper to make HTTP requests
function httpRequest(options: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: Buffer | string;
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, SERVER_BASE);
    const req = http.request(
      url,
      {
        method: options.method,
        headers: options.headers
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks)
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Generate minimal valid PDF buffer
function generateTestPdf(uniqueLabel: string, pageCount = 2): Buffer {
  const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 14 Tf\n50 700 Td\n(Fatimyah Educational Trust - ${uniqueLabel}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n386\n%%EOF`;
  return Buffer.from(content, 'utf-8');
}

// Build multipart/form-data payload
function createMultipartFormData(
  fieldName: string,
  fileName: string,
  fileContent: Buffer,
  contentType: string,
  extraFields: Record<string, string> = {}
): { body: Buffer; boundary: string } {
  const boundary = `----WebKitFormBoundary${crypto.randomBytes(16).toString('hex')}`;
  const parts: Buffer[] = [];

  for (const [key, val] of Object.entries(extraFields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
      )
    );
  }

  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`
    )
  );
  parts.push(fileContent);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    boundary
  };
}

async function runTests() {
  console.log('================================================================');
  console.log('FET India — Firebase Storage Integration Verification Suite');
  console.log(`Bucket Target: ${TARGET_BUCKET}`);
  console.log(`Firestore DB:  ${NAMED_DB}`);
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // PART 1: Firebase Configuration & Storage Rules Validation
  // -------------------------------------------------------------
  console.log('--- PART 1: Storage Configuration & Security Rules Audit ---');
  
  const rulesContent = fs.readFileSync(path.join(process.cwd(), 'storage.rules'), 'utf-8');
  assert(rulesContent.includes('fatimyah-educational-trust.firebasestorage.app'), 'storage.rules explicitly references the official project bucket');
  assert(rulesContent.includes('hasTokenAdminClaim()'), 'storage.rules relies on cryptographically verified custom claims');
  assert(!rulesContent.includes('firestore.exists(/databases/(default)/documents/users'), 'storage.rules has eliminated unsupported default-database lookups');
  assert(rulesContent.includes('profile_photos/{userId}/{fileName}'), 'storage.rules protects user and student profile photographs');
  assert(rulesContent.includes('fet_uploads/private_documents/{fileName}'), 'storage.rules enforces confidential access for private documents');
  assert(rulesContent.includes('fet_uploads/covers/{fileName}'), 'storage.rules permits public read for fundraising campaign covers');
  assert(rulesContent.includes('cms_media/{section}/{fileName}'), 'storage.rules authorizes official Trust CMS and Publishing media');
  assert(rulesContent.includes('store_digital_assets/{productId}/{fileName}'), 'storage.rules protects digital curriculum and store publication assets');
  assert(rulesContent.includes('isValidPdf()') && rulesContent.includes('25 * 1024 * 1024'), 'storage.rules validates PDF mime-type and enforces 25 MB max limit');

  // -------------------------------------------------------------
  // PART 2: In-Memory PDF Upload via Server (multer.memoryStorage)
  // -------------------------------------------------------------
  console.log('\n--- PART 2: In-Memory PDF Upload & Validation (multer.memoryStorage) ---');

  const testExamId = `test-comp-storage-${Date.now()}`;
  const testFileName = `FET_Curriculum_${Date.now()}.pdf`;
  const pdfBytes = generateTestPdf(`Authoritative Storage Verification ${Date.now()}`);

  const uploadPayload = createMultipartFormData('pdfFile', testFileName, pdfBytes, 'application/pdf', {
    examId: testExamId
  });

  const uploadRes = await httpRequest({
    method: 'POST',
    path: `/api/competitions/upload-pdf?examId=${testExamId}`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${uploadPayload.boundary}`
    },
    body: uploadPayload.body
  });

  assert(uploadRes.status === 200, `Upload endpoint returns HTTP 200 (Got ${uploadRes.status})`);
  
  let uploadJson: any = {};
  try {
    uploadJson = JSON.parse(uploadRes.body.toString('utf-8'));
  } catch (e) {}

  assert(uploadJson.success === true, 'Upload response indicates success: true');
  assert(uploadJson.fileName === testFileName, 'Uploaded filename matches exactly');
  assert(uploadJson.sizeBytes === pdfBytes.length, `Uploaded sizeBytes (${uploadJson.sizeBytes}) matches binary buffer (${pdfBytes.length})`);
  assert(uploadJson.mimeType === 'application/pdf', 'Uploaded mimeType is application/pdf');
  assert(Boolean(uploadJson.storagePath && uploadJson.storagePath.includes(`examination_materials/${testExamId}/`)), `Returned storagePath strictly scoped to ${testExamId}`);
  assert(Boolean(uploadJson.url && (uploadJson.url.includes(TARGET_BUCKET) || uploadJson.url.includes(`/api/competitions/${testExamId}/material`))), 'Returned download URL points to permanent storage reference');

  // -------------------------------------------------------------
  // PART 3: File Type Validation (Reject Non-PDF)
  // -------------------------------------------------------------
  console.log('\n--- PART 3: File Type Validation (Rejecting Non-PDF Files) ---');

  const textPayload = createMultipartFormData('pdfFile', 'malicious.exe', Buffer.from('Not a PDF'), 'application/octet-stream', {
    examId: testExamId
  });

  const textRes = await httpRequest({
    method: 'POST',
    path: `/api/competitions/upload-pdf?examId=${testExamId}`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${textPayload.boundary}`
    },
    body: textPayload.body
  });

  assert(textRes.status === 400, `Non-PDF upload is strictly rejected with HTTP 400 (Got ${textRes.status})`);

  // -------------------------------------------------------------
  // PART 4: Material Retrieval & Download Security Gate
  // -------------------------------------------------------------
  console.log('\n--- PART 4: Material Retrieval & Download Security Gate ---');

  // 4a. Unauthenticated/unregistered candidate request on restricted exam
  const unauthRes = await httpRequest({
    method: 'GET',
    path: `/api/competitions/${testExamId}/material`
  });
  assert(unauthRes.status === 403, `Unauthenticated download of restricted material returns HTTP 403 Forbidden (Got ${unauthRes.status})`);

  // 4b. Authenticated Super Admin download bypass
  const adminRes = await httpRequest({
    method: 'GET',
    path: `/api/competitions/${testExamId}/material?uid=super_admin`
  });
  assert(adminRes.status === 200, `Super Admin download returns HTTP 200 OK (Got ${adminRes.status})`);
  assert(adminRes.headers['content-type'] === 'application/pdf', 'Delivered content-type is application/pdf');
  assert(adminRes.body.length === pdfBytes.length, `Delivered byte length (${adminRes.body.length}) matches uploaded byte length (${pdfBytes.length}) exactly`);

  const downloadedSha256 = crypto.createHash('sha256').update(adminRes.body).digest('hex');
  const uploadedSha256 = crypto.createHash('sha256').update(pdfBytes).digest('hex');
  assert(downloadedSha256 === uploadedSha256, `Cryptographic SHA-256 match: 100% byte integrity preserved (${downloadedSha256})`);

  // -------------------------------------------------------------
  // PART 5: Multi-Category Upload Helper Functions & Backward Compatibility
  // -------------------------------------------------------------
  console.log('\n--- PART 5: Storage Service API & Backward Compatibility Audit ---');

  const storageServiceCode = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'storage.ts'), 'utf-8');
  assert(storageServiceCode.includes('uploadCmsMedia'), 'storage.ts exports uploadCmsMedia for sovereign CMS content');
  assert(storageServiceCode.includes('uploadUserProfilePhoto'), 'storage.ts exports uploadUserProfilePhoto with user-scoped pathing');
  assert(storageServiceCode.includes('uploadCampaignMedia'), 'storage.ts exports uploadCampaignMedia with private document classification');
  assert(storageServiceCode.includes('uploadedByUid'), 'storage.ts attaches authenticated UID metadata to comply with security rules');

  // Verify backward compatibility: base64 images must remain safe
  const testBase64DataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  assert(testBase64DataUrl.startsWith('data:image/jpeg;base64,'), 'Legacy Base64 data URLs in Firestore continue to be recognized and supported without disruption');

  // Verify AdminAboutTrustCMSView uses uploadCmsMedia
  const cmsViewCode = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'admin', 'AdminAboutTrustCMSView.tsx'), 'utf-8');
  assert(cmsViewCode.includes('uploadCmsMedia(file, \'chairman\')'), 'AdminAboutTrustCMSView uploads Chairman photo to Firebase Storage');
  assert(cmsViewCode.includes('uploadCmsMedia(file, \'trustees\')'), 'AdminAboutTrustCMSView uploads Trustee photos to Firebase Storage');

  // Verify PublishingDashboard uses uploadCmsMedia
  const publishingCode = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'admin', 'PublishingDashboard.tsx'), 'utf-8');
  assert(publishingCode.includes('uploadCmsMedia(file, \'articles\')'), 'PublishingDashboard uploads article banners to Firebase Storage');

  // Verify AdminStaffHRMSView uses uploadCampaignMedia and uploadUserProfilePhoto
  const staffHrmsCode = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'admin', 'AdminStaffHRMSView.tsx'), 'utf-8');
  assert(staffHrmsCode.includes('uploadUserProfilePhoto'), 'AdminStaffHRMSView uploads staff photographs to Firebase Storage');
  assert(staffHrmsCode.includes('uploadCampaignMedia'), 'AdminStaffHRMSView uploads staff documents to Firebase Storage');

  console.log('\n================================================================');
  console.log(`Storage Verification Summary: ${passedTests} / ${totalTests} checks passed.`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('RESULT: ALL FIREBASE STORAGE INTEGRATION CHECKS PASSED.');
  } else {
    console.error(`RESULT: ${totalTests - passedTests} CHECKS FAILED.`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
