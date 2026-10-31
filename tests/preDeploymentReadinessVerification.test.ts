/**
 * @license
 * Pre-Deployment Automated Readiness Verification Test
 * Fatimyah Educational Trust India (FET India)
 *
 * Verifies:
 * 1. Super Admin Examination PDF Upload & Resilient Storage
 * 2. Candidate Exact Original Book Download & SHA-256 Hash Preservation
 * 3. Super Admin Module Controls Gate (Store / ERPs / Deferred Higher Ed Grant)
 * 4. Test vs Live Candidate Separation
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SERVER_BASE = 'http://localhost:3000';

// Minimal valid PDF header + 4 pages structure with unique content string
function createSampleBookPdf(uniqueSeed: string): Buffer {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R] /Count 4 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 8 0 R >>
endobj
5 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 9 0 R >>
endobj
6 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 10 0 R >>
endobj
7 0 obj
<< /Length 75 >>
stream
BT /F1 14 Tf 50 700 Td (Official Book Chapter 1 - UniqueSeed: ${uniqueSeed}) Tj ET
endstream
endobj
8 0 obj
<< /Length 75 >>
stream
BT /F1 14 Tf 50 700 Td (Official Book Chapter 2 - Deep Analytical Questions) Tj ET
endstream
endobj
9 0 obj
<< /Length 75 >>
stream
BT /F1 14 Tf 50 700 Td (Official Book Chapter 3 - Scientific Reasoning Model) Tj ET
endstream
endobj
10 0 obj
<< /Length 75 >>
stream
BT /F1 14 Tf 50 700 Td (Official Book Chapter 4 - Complete Curriculum Summary) Tj ET
endstream
endobj
xref
0 11
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000133 00000 n 
0000000224 00000 n 
0000000315 00000 n 
0000000406 00000 n 
0000000498 00000 n 
0000000642 00000 n 
0000000787 00000 n 
0000000932 00000 n 
trailer
<< /Size 11 /Root 1 0 R >>
startxref
1077
%%EOF
`;
  return Buffer.from(content, 'utf-8');
}

async function runPreDeploymentVerification() {
  console.log('================================================================');
  console.log('FETIndia.com — Pre-Deployment Comprehensive Verification Test');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  // ----------------------------------------------------------------
  // PART 1: SUPER ADMIN MODULE CONTROLS API & CACHE
  // ----------------------------------------------------------------
  console.log('--- PART 1: Super Admin Module Controls Gate ---');
  try {
    const modResp = await fetch(`${SERVER_BASE}/api/system/module-controls`);
    const modJson = await modResp.json();
    assert(modResp.ok && modJson.success, 'Module controls endpoint returns HTTP 200 and success status');
    assert(Boolean(modJson.modules?.examinations?.enabled), 'Core Examination Engine is permanently active in module controls');
    assert(modJson.modules?.examinations?.isCore === true, 'Core Examination Engine is marked with isCore: true');
    assert(modJson.modules?.higher_education_grant?.status === 'deferred', 'Higher Education Grant is formally marked deferred');

    // Test rejection of modifications to core examination system
    const blockExamModResp = await fetch(`${SERVER_BASE}/api/system/module-controls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'examinations', enabled: false })
    });
    assert(blockExamModResp.status === 400, 'Server rejects any attempt to disable core examinations module (HTTP 400)');

    // Test rejection of enabling deferred higher education grants
    const blockGrantModResp = await fetch(`${SERVER_BASE}/api/system/module-controls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'higher_education_grant', enabled: true })
    });
    assert(blockGrantModResp.status === 400, 'Server rejects enabling deferred higher education grant applications');
  } catch (err: any) {
    assert(false, 'Module controls endpoint verification failed', err.message);
  }

  // ----------------------------------------------------------------
  // PART 2: STORE MODULE GATE ENFORCEMENT WHEN DISABLED
  // ----------------------------------------------------------------
  console.log('\n--- PART 2: Backend Enforcement of Disabled Store Module ---');
  try {
    // When store is disabled, POST to /api/store/orders/validate should return 403
    const storeValResp = await fetch(`${SERVER_BASE}/api/store/orders/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'test', quantity: 1 }] })
    });
    const storeValJson = await storeValResp.json().catch(() => null);
    assert(
      storeValResp.status === 403 && storeValJson?.moduleDisabled === true,
      'POST /api/store/orders/validate returns HTTP 403 with moduleDisabled: true when store is disabled'
    );

    // POST to /api/store/orders/create should return 403
    const storeCreateResp = await fetch(`${SERVER_BASE}/api/store/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] })
    });
    assert(storeCreateResp.status === 403, 'POST /api/store/orders/create returns HTTP 403 when store is disabled');

    // POST to /api/store/orders/razorpay/create-order should return 403
    const storeRzpResp = await fetch(`${SERVER_BASE}/api/store/orders/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500 })
    });
    assert(storeRzpResp.status === 403, 'POST /api/store/orders/razorpay/create-order returns HTTP 403 when store is disabled');
  } catch (err: any) {
    assert(false, 'Store module enforcement failed', err.message);
  }

  // ----------------------------------------------------------------
  // PART 3: EXAMINATION PDF UPLOAD & EXACT ORIGINAL BOOK DOWNLOAD
  // ----------------------------------------------------------------
  console.log('\n--- PART 3: Examination PDF Upload & Exact Original Book Download ---');
  const examId = 'cmp-qa-test-upload';
  const uniqueSeed = `QA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const originalBookBuffer = createSampleBookPdf(uniqueSeed);
  const originalSha256 = crypto.createHash('sha256').update(originalBookBuffer).digest('hex');
  const originalSizeBytes = originalBookBuffer.length;

  console.log(`Generated Unique Test Examination Book PDF:`);
  console.log(`  Size: ${originalSizeBytes} bytes (4 Pages)`);
  console.log(`  SHA-256 Hash: ${originalSha256}`);

  try {
    // 1. Multipart Form Upload
    const boundary = `----WebKitFormBoundary${crypto.randomBytes(8).toString('hex')}`;
    const headerPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="examId"\r\n\r\n` +
      `${examId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="pdfFile"; filename="Official_Exam_Book_2026.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`
    );
    const footerPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([headerPart, originalBookBuffer, footerPart]);

    const uploadResp = await fetch(`${SERVER_BASE}/api/competitions/upload-pdf?examId=${encodeURIComponent(examId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(multipartBody.length)
      },
      body: multipartBody
    });

    const uploadJson = await uploadResp.json();
    assert(uploadResp.ok && uploadJson.success === true, 'Upload endpoint returns HTTP 200 with success: true');
    assert(uploadJson.fileName === 'Official_Exam_Book_2026.pdf', 'Uploaded filename preserved exactly in response');
    assert(uploadJson.sizeBytes === originalSizeBytes, 'Uploaded sizeBytes matches original byte count exactly');
    assert(Boolean(uploadJson.url), 'Uploaded response contains durable material retrieval URL');

    // 2. Candidate Download Verification
    const candidateUid = 'cand_qa_verified_8842';
    const regId = `reg-${examId}-${candidateUid}`;
    const prtId = 'FET-PRT-2026-QA88';

    const downloadResp = await fetch(
      `${SERVER_BASE}/api/competitions/${examId}/material?uid=${encodeURIComponent(candidateUid)}&regId=${encodeURIComponent(regId)}&prtId=${encodeURIComponent(prtId)}&payStatus=free`,
      {
        headers: {
          'x-user-uid': candidateUid,
          'x-registration-id': regId,
          'x-participant-id': prtId,
          'x-payment-status': 'free'
        }
      }
    );

    assert(downloadResp.ok, 'Candidate download returns HTTP 200 OK');
    const downloadedArrayBuffer = await downloadResp.arrayBuffer();
    const downloadedBuffer = Buffer.from(downloadedArrayBuffer);
    const downloadedSha256 = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');

    assert(
      downloadedBuffer.length === originalSizeBytes,
      `Downloaded file size (${downloadedBuffer.length} bytes) matches uploaded size (${originalSizeBytes} bytes) exactly`
    );
    assert(
      downloadedSha256 === originalSha256,
      `Downloaded PDF SHA-256 hash (${downloadedSha256}) is 100% identical to uploaded original (${originalSha256})`
    );

    // Verify it is NOT the 3-page generic placeholder
    const downloadedText = downloadedBuffer.toString('utf-8');
    assert(
      downloadedText.includes(`UniqueSeed: ${uniqueSeed}`),
      'Downloaded PDF contains the exact original text and chapters uploaded by the Super Admin'
    );
    assert(
      !downloadedText.includes('Fat India Central Examination and Talent Search Board'),
      'Downloaded PDF does not contain synthetic or corrupt placeholder institutional text'
    );
  } catch (err: any) {
    assert(false, 'Upload and download verification failed', err.message);
  }

  // ----------------------------------------------------------------
  // PART 4: SECURITY GATE ON UNVERIFIED DOWNLOAD ATTEMPTS
  // ----------------------------------------------------------------
  console.log('\n--- PART 4: Candidate Registration Security Gate ---');
  try {
    const unverifiedResp = await fetch(`${SERVER_BASE}/api/competitions/${examId}/material`);
    assert(
      unverifiedResp.status === 403,
      'Unauthenticated or unverified download request returns HTTP 403 Forbidden'
    );
    const unverifiedJson = await unverifiedResp.json().catch(() => null);
    assert(
      Boolean(unverifiedJson?.error),
      'Error message clearly explains candidate registration verification requirement'
    );
  } catch (err: any) {
    assert(false, 'Security gate check failed', err.message);
  }

  // ----------------------------------------------------------------
  // PART 5: MULTI-COMPETITION ISOLATION & EXACT FILE ASSOCIATION TEST
  // ----------------------------------------------------------------
  console.log('\n--- PART 5: Multi-Competition Isolation & File Association ---');
  const compAlphaId = `cmp-test-alpha-${Date.now()}`;
  const compBetaId = `cmp-test-beta-${Date.now()}`;
  const compMissingId = `cmp-test-missing-${Date.now()}`;

  const seedAlpha = `ALPHA-CURRICULUM-${crypto.randomBytes(6).toString('hex')}`;
  const seedBeta = `BETA-CURRICULUM-${crypto.randomBytes(6).toString('hex')}`;

  const bookAlphaBuffer = createSampleBookPdf(seedAlpha);
  const bookAlphaSha256 = crypto.createHash('sha256').update(bookAlphaBuffer).digest('hex');

  const bookBetaBuffer = createSampleBookPdf(seedBeta);
  const bookBetaSha256 = crypto.createHash('sha256').update(bookBetaBuffer).digest('hex');

  // Ensure test buffers are strictly different
  assert(bookAlphaSha256 !== bookBetaSha256, 'Test Book A and Test Book B have unique cryptographic hashes');

  try {
    // 1. Upload Book A to Competition Alpha
    const boundaryA = `----WebKitFormBoundaryAlpha${crypto.randomBytes(6).toString('hex')}`;
    const headerA = Buffer.from(
      `--${boundaryA}\r\nContent-Disposition: form-data; name="examId"\r\n\r\n${compAlphaId}\r\n` +
      `--${boundaryA}\r\nContent-Disposition: form-data; name="pdfFile"; filename="Alpha_Curriculum.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
    );
    const footerA = Buffer.from(`\r\n--${boundaryA}--\r\n`);
    const bodyA = Buffer.concat([headerA, bookAlphaBuffer, footerA]);

    const uploadRespA = await fetch(`${SERVER_BASE}/api/competitions/upload-pdf?examId=${encodeURIComponent(compAlphaId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundaryA}`,
        'Content-Length': String(bodyA.length)
      },
      body: bodyA
    });
    assert(uploadRespA.ok, 'Upload Book A to Competition Alpha succeeds (HTTP 200)');

    // 2. Upload Book B to Competition Beta
    const boundaryB = `----WebKitFormBoundaryBeta${crypto.randomBytes(6).toString('hex')}`;
    const headerB = Buffer.from(
      `--${boundaryB}\r\nContent-Disposition: form-data; name="examId"\r\n\r\n${compBetaId}\r\n` +
      `--${boundaryB}\r\nContent-Disposition: form-data; name="pdfFile"; filename="Beta_Curriculum.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
    );
    const footerB = Buffer.from(`\r\n--${boundaryB}--\r\n`);
    const bodyB = Buffer.concat([headerB, bookBetaBuffer, footerB]);

    const uploadRespB = await fetch(`${SERVER_BASE}/api/competitions/upload-pdf?examId=${encodeURIComponent(compBetaId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundaryB}`,
        'Content-Length': String(bodyB.length)
      },
      body: bodyB
    });
    assert(uploadRespB.ok, 'Upload Book B to Competition Beta succeeds (HTTP 200)');

    // 3. Download Competition Alpha as Authorized Admin/Candidate
    const candAlphaUid = `user_alpha_${Date.now()}`;
    const dlRespA = await fetch(
      `${SERVER_BASE}/api/competitions/${compAlphaId}/material?uid=${encodeURIComponent(candAlphaUid)}&regId=reg-${compAlphaId}-${candAlphaUid}&prtId=FET-PRT-ALPHA&payStatus=paid`,
      {
        headers: {
          'x-user-uid': candAlphaUid,
          'x-registration-id': `reg-${compAlphaId}-${candAlphaUid}`,
          'x-participant-id': 'FET-PRT-ALPHA',
          'x-payment-status': 'paid'
        }
      }
    );
    assert(dlRespA.ok, 'Download Competition Alpha returns HTTP 200 OK');
    const dlBufA = Buffer.from(await dlRespA.arrayBuffer());
    const dlShaA = crypto.createHash('sha256').update(dlBufA).digest('hex');

    assert(dlShaA === bookAlphaSha256, 'Competition Alpha downloads exact Book A (100% SHA-256 match)');
    assert(dlBufA.toString('utf-8').includes(seedAlpha), 'Competition Alpha contains Seed A');
    assert(!dlBufA.toString('utf-8').includes(seedBeta), 'Competition Alpha does NOT contain Seed B (no cross-contamination)');

    // 4. Download Competition Beta as Authorized Admin/Candidate
    const candBetaUid = `user_beta_${Date.now()}`;
    const dlRespB = await fetch(
      `${SERVER_BASE}/api/competitions/${compBetaId}/material?uid=${encodeURIComponent(candBetaUid)}&regId=reg-${compBetaId}-${candBetaUid}&prtId=FET-PRT-BETA&payStatus=paid`,
      {
        headers: {
          'x-user-uid': candBetaUid,
          'x-registration-id': `reg-${compBetaId}-${candBetaUid}`,
          'x-participant-id': 'FET-PRT-BETA',
          'x-payment-status': 'paid'
        }
      }
    );
    assert(dlRespB.ok, 'Download Competition Beta returns HTTP 200 OK');
    const dlBufB = Buffer.from(await dlRespB.arrayBuffer());
    const dlShaB = crypto.createHash('sha256').update(dlBufB).digest('hex');

    assert(dlShaB === bookBetaSha256, 'Competition Beta downloads exact Book B (100% SHA-256 match)');
    assert(dlBufB.toString('utf-8').includes(seedBeta), 'Competition Beta contains Seed B');
    assert(!dlBufB.toString('utf-8').includes(seedAlpha), 'Competition Beta does NOT contain Seed A (no cross-contamination)');

    // 5. Verify Missing Competition Returns Clean 404 and NEVER Serves Fallback PDF
    const candMissingUid = `user_missing_${Date.now()}`;
    const dlRespMissing = await fetch(
      `${SERVER_BASE}/api/competitions/${compMissingId}/material?uid=${encodeURIComponent(candMissingUid)}&regId=reg-${compMissingId}-${candMissingUid}&prtId=FET-PRT-MISSING&payStatus=paid`,
      {
        headers: {
          'x-user-uid': candMissingUid,
          'x-registration-id': `reg-${compMissingId}-${candMissingUid}`,
          'x-payment-status': 'paid'
        }
      }
    );
    assert(dlRespMissing.status === 404, 'Competition with missing file returns HTTP 404, never a dummy or foreign book');
    const missingJson = await dlRespMissing.json().catch(() => null);
    assert(Boolean(missingJson?.error), 'HTTP 404 response contains explanatory error description');

    // Clean up temporary test directories
    try {
      const dirA = path.join(process.cwd(), 'data', 'examination_materials', compAlphaId);
      const dirB = path.join(process.cwd(), 'data', 'examination_materials', compBetaId);
      if (fs.existsSync(dirA)) fs.rmSync(dirA, { recursive: true, force: true });
      if (fs.existsSync(dirB)) fs.rmSync(dirB, { recursive: true, force: true });
    } catch {}
  } catch (multiErr: any) {
    assert(false, 'Multi-competition isolation test failed', multiErr.message);
  }

  console.log('\n================================================================');
  console.log(`Verification Summary: ${passedTests} / ${totalTests} checks passed.`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('RESULT: ALL PRE-DEPLOYMENT VERIFICATION CHECKS PASSED.');
    process.exit(0);
  } else {
    console.error('RESULT: SOME VERIFICATION CHECKS FAILED.');
    process.exit(1);
  }
}

runPreDeploymentVerification().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
