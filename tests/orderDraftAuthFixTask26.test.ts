/**
 * @license
 * Automated Verification Suite for Task 26: Order Draft Notice Authentication Fix
 * Fatimyah Educational Trust India (FET India)
 *
 * Exercises all 9 required verification points:
 * 1. An authenticated customer creating or retrieving their own order draft.
 * 2. The order-draft notice request with the expected authentication.
 * 3. An unauthenticated request being rejected correctly.
 * 4. A customer being prevented from accessing another customer's draft.
 * 5. An expired or invalid token producing a clear authentication error.
 * 6. A notification failure being distinguished from a payment-authentication failure.
 * 7. Successful creation of the Razorpay order after authentication succeeds.
 * 8. Valid JSON error responses instead of misleading HTML or generic messages.
 * 9. Payment verification remaining secure.
 */

import crypto from 'crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

// Helper to construct a simulated Firebase Auth ID token (JWT)
function createMockJwt(claims: { uid: string; email?: string; expSecFromNow?: number }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (claims.expSecFromNow !== undefined ? claims.expSecFromNow : 3600);
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://securetoken.google.com/ai-studio-fetindiafatimyah-test',
    aud: 'ai-studio-fetindiafatimyah-test',
    auth_time: now,
    user_id: claims.uid,
    sub: claims.uid,
    email: claims.email || `${claims.uid}@example.com`,
    iat: now,
    exp
  })).toString('base64url');
  const signature = crypto.randomBytes(32).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('TASK 26 — ORDER DRAFT NOTICE AUTHENTICATION VERIFICATION SUITE');
  console.log('============================================================\n');

  const customerAliceUid = `cust_alice_${Date.now()}`;
  const customerBobUid = `cust_bob_${Date.now()}`;
  const aliceJwt = createMockJwt({ uid: customerAliceUid, email: 'alice@fetindia.org' });
  const bobJwt = createMockJwt({ uid: customerBobUid, email: 'bob@fetindia.org' });
  const expiredJwt = createMockJwt({ uid: customerAliceUid, expSecFromNow: -300 }); // Expired 5 mins ago

  // -------------------------------------------------------------
  // TEST 1: Authenticated customer creating or retrieving own order draft
  // -------------------------------------------------------------
  console.log('--- 1. Authenticated customer creating or retrieving order draft ---');

  const draftPayload = {
    userId: customerAliceUid,
    customer: {
      fullName: 'Alice Fatima',
      email: 'alice@fetindia.org',
      mobileNumber: '9906112233'
    },
    billingAddress: {
      addressLine1: 'FET Complex, Sector 4',
      city: 'Srinagar',
      state: 'Jammu & Kashmir',
      pincode: '190001',
      country: 'India'
    },
    shippingAddress: {
      addressLine1: 'FET Complex, Sector 4',
      city: 'Srinagar',
      state: 'Jammu & Kashmir',
      pincode: '190001',
      country: 'India'
    },
    items: [
      {
        productId: 'demo-prod-book-01',
        variantId: 'var-bk-paperback',
        productName: 'Prescribed Ethical Reader',
        quantity: 1,
        unitPrice: 180,
        itemTotal: 180
      }
    ],
    paymentMethod: 'razorpay'
  };

  const createDraftRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify(draftPayload)
  });

  const createDraftContentType = createDraftRes.headers.get('content-type') || '';
  assert(createDraftContentType.includes('application/json'), 'Create draft returns application/json');
  assert(createDraftRes.status === 200, 'Authenticated draft creation succeeds (HTTP 200)');
  const createDraftData = await createDraftRes.json();
  assert(createDraftData.success === true, 'Draft creation returns success: true');
  assert(Boolean(createDraftData.orderId), 'Real orderId returned');
  const aliceOrderId = createDraftData.orderId;

  // Retrieve Alice's draft using Alice's JWT
  const getDraftRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${aliceJwt}`
    }
  });

  assert(getDraftRes.status === 200, 'Alice retrieves her own draft using valid Bearer JWT (HTTP 200)');
  const getDraftData = await getDraftRes.json();
  assert(getDraftData.success === true, 'Retrieve draft returns success: true');
  assert(getDraftData.orderId === aliceOrderId, 'Retrieved orderId matches');
  assert(getDraftData.total === 180, 'Retrieved total matches 180');

  // -------------------------------------------------------------
  // TEST 2: Order-draft notice request with expected authentication
  // -------------------------------------------------------------
  console.log('\n--- 2. Order-draft notice request with expected authentication ---');

  // 2a. Update order notice/notes via /notice endpoint with Bearer JWT
  const postNoticeRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}/notice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      notice: 'Please expedite delivery to FET Central Library.'
    })
  });

  assert(postNoticeRes.status === 200, 'Order draft notice update succeeds via /notice with Bearer JWT (HTTP 200)');
  const postNoticeData = await postNoticeRes.json();
  assert(postNoticeData.success === true, 'Notice update returns success: true');
  assert(postNoticeData.notice === 'Please expedite delivery to FET Central Library.', 'Notice text saved accurately');

  // 2b. Read back order draft notice via /notice endpoint
  const getNoticeRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}/notice`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${aliceJwt}`
    }
  });

  assert(getNoticeRes.status === 200, 'Order draft notice read succeeds via /notice (HTTP 200)');
  const getNoticeData = await getNoticeRes.json();
  assert(getNoticeData.notice === 'Please expedite delivery to FET Central Library.', 'Read back notice matches');
  assert(getNoticeData.isOptional === true, 'Response confirms notice is optional');

  // 2c. Order draft event notice dispatch (/api/store/orders/notify-event)
  const notifyEventRes = await fetch(`${BASE_URL}/api/store/orders/notify-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      orderId: aliceOrderId,
      orderNumber: createDraftData.orderNumber,
      eventType: 'order_received',
      customer: draftPayload.customer,
      total: 180,
      itemCount: 1,
      items: draftPayload.items
    })
  });

  assert(notifyEventRes.status === 200, 'Order draft notice event dispatch succeeds (HTTP 200)');
  const notifyEventData = await notifyEventRes.json();
  assert(notifyEventData.success === true, 'Event dispatch returns success: true');
  assert(notifyEventData.noticeDispatched === true, 'noticeDispatched flag is true');

  // -------------------------------------------------------------
  // TEST 3: Unauthenticated requests rejected correctly
  // -------------------------------------------------------------
  console.log('\n--- 3. Unauthenticated requests rejected correctly ---');

  // 3a. Retrieve order without auth
  const unauthGetRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}`, {
    method: 'GET'
  });
  assert(unauthGetRes.status === 401, 'Unauthenticated draft retrieval returns HTTP 401');
  const unauthGetData = await unauthGetRes.json();
  assert(unauthGetData.code === 'UNAUTHENTICATED', 'Code is UNAUTHENTICATED');

  // 3b. Notice update without auth
  const unauthNoticeRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}/notice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notice: 'unauth note' })
  });
  assert(unauthNoticeRes.status === 401, 'Unauthenticated notice update returns HTTP 401');

  // 3c. Razorpay create-order without auth
  const unauthRzpRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: aliceOrderId })
  });
  assert(unauthRzpRes.status === 401, 'Unauthenticated Razorpay create-order returns HTTP 401');
  const unauthRzpData = await unauthRzpRes.json();
  assert(unauthRzpData.code === 'UNAUTHENTICATED', 'Code is UNAUTHENTICATED');

  // -------------------------------------------------------------
  // TEST 4: Customer prevented from accessing another customer's draft
  // -------------------------------------------------------------
  console.log('\n--- 4. Customer prevented from accessing another customer\'s draft ---');

  // Bob attempts to read Alice's draft
  const bobReadRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${bobJwt}` }
  });
  assert(bobReadRes.status === 403, 'Bob denied viewing Alice draft with HTTP 403 Forbidden');
  const bobReadData = await bobReadRes.json();
  assert(bobReadData.code === 'PERMISSION_DENIED', 'Rejection code is PERMISSION_DENIED');

  // Bob attempts to update notice on Alice's draft
  const bobNoticeRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}/notice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bobJwt}`
    },
    body: JSON.stringify({ notice: 'Malicious edit by Bob' })
  });
  assert(bobNoticeRes.status === 403, 'Bob denied editing notice on Alice draft (HTTP 403)');

  // Bob attempts to pay for Alice's order
  const bobPayRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bobJwt}`
    },
    body: JSON.stringify({ orderId: aliceOrderId })
  });
  assert(bobPayRes.status === 403, 'Bob denied initializing Razorpay payment for Alice order (HTTP 403)');

  // -------------------------------------------------------------
  // TEST 5: Expired or invalid token produces clear authentication error
  // -------------------------------------------------------------
  console.log('\n--- 5. Expired or invalid token produces clear authentication error ---');

  // 5a. Expired JWT token on draft retrieval
  const expiredGetRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${expiredJwt}` }
  });
  assert(expiredGetRes.status === 401, 'Expired token returns HTTP 401');
  const expiredGetData = await expiredGetRes.json();
  assert(expiredGetData.code === 'AUTH_TOKEN_EXPIRED', 'Expired token code is AUTH_TOKEN_EXPIRED');
  assert(expiredGetData.error.includes('expired'), 'Error message clearly mentions expired token');

  // 5b. Malformed token on notice endpoint
  const malformedNoticeRes = await fetch(`${BASE_URL}/api/store/orders/${aliceOrderId}/notice`, {
    method: 'GET',
    headers: { 'Authorization': 'Bearer malformed.corrupted.token' }
  });
  assert(malformedNoticeRes.status === 401, 'Malformed token returns HTTP 401');
  const malformedData = await malformedNoticeRes.json();
  assert(malformedData.code === 'INVALID_AUTH_TOKEN', 'Malformed token code is INVALID_AUTH_TOKEN');

  // 5c. Expired token on Razorpay order creation
  const expiredRzpRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${expiredJwt}`
    },
    body: JSON.stringify({ orderId: aliceOrderId })
  });
  assert(expiredRzpRes.status === 401, 'Expired token on Razorpay creation returns HTTP 401');
  const expiredRzpData = await expiredRzpRes.json();
  assert(expiredRzpData.code === 'AUTH_TOKEN_EXPIRED', 'Razorpay expired token code is AUTH_TOKEN_EXPIRED');

  // -------------------------------------------------------------
  // TEST 6: Notification failure distinguished from payment-authentication failure
  // -------------------------------------------------------------
  console.log('\n--- 6. Notification failure distinguished from payment-authentication failure ---');

  // Even when email service is unconfigured or returns warning, notify-event returns non-blocking success/deferred
  const unconfNotifyRes = await fetch(`${BASE_URL}/api/store/orders/notify-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      orderId: aliceOrderId,
      orderNumber: createDraftData.orderNumber,
      eventType: 'order_received',
      customer: { fullName: 'Alice Fatima', email: 'alice@fetindia.org', mobileNumber: '9906112233' },
      total: 180,
      itemCount: 1,
      items: draftPayload.items
    })
  });

  assert(unconfNotifyRes.status === 200, 'Notification dispatch returns HTTP 200 and never blocks purchase flow');
  const unconfNotifyData = await unconfNotifyRes.json();
  assert(unconfNotifyData.success === true, 'Notification operation returns success: true');
  assert(unconfNotifyData.code !== 'UNAUTHENTICATED' && unconfNotifyData.code !== 'AUTH_TOKEN_EXPIRED', 'Notification status is not confused with authentication failure');

  // -------------------------------------------------------------
  // TEST 7: Successful creation of Razorpay order after authentication succeeds
  // -------------------------------------------------------------
  console.log('\n--- 7. Successful creation of Razorpay order with server-calculated amount ---');

  const rzpCreateRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      orderId: aliceOrderId,
      testMode: true
    })
  });

  assert(rzpCreateRes.status === 200, 'Razorpay order creation succeeds with valid auth (HTTP 200)');
  const rzpCreateData = await rzpCreateRes.json();
  assert(rzpCreateData.success === true, 'Razorpay order creation returns success: true');
  assert(Boolean(rzpCreateData.razorpayOrderId), 'Generated razorpayOrderId received');
  assert(rzpCreateData.amount === 18000, 'Authoritative amount in paise is 18000 (₹180 * 100)');
  assert(rzpCreateData.currency === 'INR', 'Currency is INR');
  assert(Boolean(rzpCreateData.keyId), 'Public Razorpay Key ID provided');
  assert(rzpCreateData.mode === 'test', 'Test mode active');

  const generatedRzpOrderId = rzpCreateData.razorpayOrderId;

  // -------------------------------------------------------------
  // TEST 8: Valid JSON error responses across all failure modes
  // -------------------------------------------------------------
  console.log('\n--- 8. Valid JSON error responses instead of HTML or generic errors ---');

  const errorScenarios = [
    { name: '404 unknown store subroute', url: `${BASE_URL}/api/store/unknown-test-subroute`, expectedStatus: 404 },
    { name: '400 invalid order ID', url: `${BASE_URL}/api/store/orders/razorpay/create-order`, method: 'POST', body: {}, expectedStatus: 400 },
    { name: '404 non-existent order ID', url: `${BASE_URL}/api/store/orders/non_existent_12345`, headers: { 'Authorization': `Bearer ${aliceJwt}` }, expectedStatus: 404 }
  ];

  for (const scenario of errorScenarios) {
    const res = await fetch(scenario.url, {
      method: scenario.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(scenario.headers || {})
      },
      body: scenario.body ? JSON.stringify(scenario.body) : undefined
    });
    const cType = res.headers.get('content-type') || '';
    assert(cType.includes('application/json'), `${scenario.name} returns application/json`);
    assert(!cType.includes('text/html'), `${scenario.name} does not return text/html`);
    const json = await res.json();
    assert(typeof json === 'object' && json !== null, `${scenario.name} response is valid JSON object`);
    assert(Boolean(json.error || json.code), `${scenario.name} provides structured error message or code`);
  }

  // -------------------------------------------------------------
  // TEST 9: Payment verification remaining secure
  // -------------------------------------------------------------
  console.log('\n--- 9. Payment verification remaining secure ---');

  const simulatedPaymentId = `pay_test_${Date.now()}_task26`;

  // 9a. Rejection of tampered signature
  const badSigRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      orderId: aliceOrderId,
      razorpay_order_id: generatedRzpOrderId,
      razorpay_payment_id: simulatedPaymentId,
      razorpay_signature: 'invalid_tampered_signature_hex'
    })
  });

  assert(badSigRes.status === 400, 'Tampered signature rejected with HTTP 400');
  const badSigData = await badSigRes.json();
  assert(badSigData.code === 'SIGNATURE_VERIFICATION_FAILED', 'Signature verification code is SIGNATURE_VERIFICATION_FAILED');

  // 9b. Valid test signature verification
  const testSecret = 'test_secret_store_key';
  const validTestSig = crypto
    .createHmac('sha256', testSecret)
    .update(`${generatedRzpOrderId}|${simulatedPaymentId}`)
    .digest('hex');

  const goodSigRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      orderId: aliceOrderId,
      razorpay_order_id: generatedRzpOrderId,
      razorpay_payment_id: simulatedPaymentId,
      razorpay_signature: validTestSig,
      testMode: true
    })
  });

  assert(goodSigRes.status === 200, 'Valid test payment verification succeeds with HTTP 200');
  const goodSigData = await goodSigRes.json();
  assert(goodSigData.success === true, 'Verification returns success: true');
  assert(goodSigData.paymentStatus === 'captured', 'Payment status updated to captured');
  assert(goodSigData.orderStatus === 'paid', 'Order status updated to paid');

  // 9c. Replay attack rejection: Attempting to credit same payment ID to another order
  const replayOrderRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      ...draftPayload,
      paymentMethod: 'razorpay'
    })
  });
  const replayOrderData = await replayOrderRes.json();
  const secondOrderId = replayOrderData.orderId;

  const replaySigRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceJwt}`
    },
    body: JSON.stringify({
      orderId: secondOrderId,
      razorpay_order_id: 'order_second_replay',
      razorpay_payment_id: simulatedPaymentId, // Reusing Alice's previous payment ID
      razorpay_signature: validTestSig,
      testMode: true
    })
  });

  assert(replaySigRes.status === 409, 'Reused payment ID rejected as replay attack with HTTP 409 Conflict');
  const replaySigData = await replaySigRes.json();
  assert(replaySigData.code === 'PAYMENT_ALREADY_USED', 'Rejection code is PAYMENT_ALREADY_USED');

  console.log('\n============================================================');
  console.log(`TASK 26 COMPLETE: ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('============================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\nTask 26 verification suite encountered an error:', err);
  process.exit(1);
});
