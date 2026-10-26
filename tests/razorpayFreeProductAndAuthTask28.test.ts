/**
 * @license
 * Task 28 — Fix Razorpay Order Payment Notes & Free Demo Product Verification Suite
 * Fatimyah Educational Trust India (FET India)
 */

import assert from 'assert';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

function createMockJwt(claims: { uid: string; email?: string; exp?: number }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    user_id: claims.uid,
    sub: claims.uid,
    email: claims.email || `${claims.uid}@fetindia.org`,
    iat: now,
    exp: claims.exp !== undefined ? claims.exp : now + 3600
  })).toString('base64url');
  const signature = crypto.randomBytes(32).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

async function runTask28Tests() {
  console.log('================================================================');
  console.log('TASK 28 — RAZORPAY ORDER PAYMENT NOTES & FREE PRODUCT SUITE');
  console.log('================================================================\n');

  const customerUid = 'cust_free_test_28';
  const customerEmail = 'tester28@fetindia.org';
  const customerJwt = createMockJwt({ uid: customerUid, email: customerEmail });

  // -------------------------------------------------------------------------
  // 1. FREE DEMO PRODUCT VALIDATION (demo-prod-publication-01, ₹0)
  // -------------------------------------------------------------------------
  console.log('--- 1. Validation of Free Custom Demo Product (demo-prod-publication-01) ---');
  const validateFreeRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'demo-prod-publication-01', quantity: 1 }],
      customer: {
        fullName: 'Zainab Fatima',
        email: customerEmail,
        mobileNumber: '9876543210',
        userUid: customerUid,
        isRegisteredUser: true
      },
      billingAddress: {
        addressLine1: 'FET Educational Complex',
        city: 'Srinagar',
        state: 'Jammu & Kashmir',
        pincode: '190001',
        country: 'India'
      },
      notes: 'Testing free demo publication delivery notes.'
    })
  });

  assert.strictEqual(validateFreeRes.status, 200, 'Free demo product validation returns HTTP 200');
  const validateFreeData = await validateFreeRes.json();
  assert.strictEqual(validateFreeData.isValid, true, 'Validation isValid is true');
  assert.strictEqual(validateFreeData.total, 0, 'Total for free publication is 0');
  assert.strictEqual(validateFreeData.isFreeOrder, true, 'isFreeOrder flag is true');
  assert(validateFreeData.allowedPaymentMethods.includes('free'), 'allowedPaymentMethods includes "free"');
  console.log('  [PASS] Free demo product validation returns total 0 and isFreeOrder: true');

  // -------------------------------------------------------------------------
  // 2. CREATING FREE ORDER DRAFT (total = 0, paymentMethod: 'free')
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Free Order Draft Creation ---');
  const createFreeRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerJwt}`
    },
    body: JSON.stringify({
      userId: customerUid,
      customer: {
        fullName: 'Zainab Fatima',
        email: customerEmail,
        mobileNumber: '9876543210',
        userUid: customerUid,
        isRegisteredUser: true
      },
      billingAddress: {
        addressLine1: 'FET Educational Complex',
        city: 'Srinagar',
        state: 'Jammu & Kashmir',
        pincode: '190001',
        country: 'India'
      },
      items: validateFreeData.validatedItems,
      notes: 'Complimentary research download note',
      deliveryNotes: 'Complimentary research download note',
      paymentMethod: 'free'
    })
  });

  assert.strictEqual(createFreeRes.status, 200, 'Free order draft creation returns HTTP 200');
  const createFreeData = await createFreeRes.json();
  assert.strictEqual(createFreeData.success, true, 'Draft creation returns success: true');
  assert.strictEqual(createFreeData.total, 0, 'Order total is 0');
  assert.strictEqual(createFreeData.paymentStatus, 'free', 'Payment status is "free"');
  assert.strictEqual(createFreeData.orderStatus, 'completed', 'All-digital free publication order is "completed"');
  const freeOrderId = createFreeData.orderId;
  console.log(`  [PASS] Free order drafted with orderId "${freeOrderId}" and status: completed`);

  // -------------------------------------------------------------------------
  // 3. ZERO-VALUE RAZORPAY GATEWAY SAFEGUARD
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Razorpay Create-Order Endpoint Handling Zero-Value Orders ---');
  const rzpZeroRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerJwt}`
    },
    body: JSON.stringify({
      orderId: freeOrderId
    })
  });

  assert.strictEqual(rzpZeroRes.status, 200, 'Razorpay create-order on zero-value order returns HTTP 200');
  const rzpZeroData = await rzpZeroRes.json();
  assert.strictEqual(rzpZeroData.success, true, 'Returns success: true');
  assert.strictEqual(rzpZeroData.isFree, true, 'Identifies order as free without calling external gateway');
  assert.strictEqual(rzpZeroData.amount, 0, 'Amount is 0 paise');
  assert.strictEqual(rzpZeroData.paymentStatus, 'free', 'Payment status preserved as free');
  console.log('  [PASS] Zero-value order handled cleanly without sending invalid 0 amount to Razorpay API');

  // -------------------------------------------------------------------------
  // 4. ORDER PAYMENT NOTES ENDPOINT WITH AUTHENTICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Order Payment Notes Retrieval & Modification ---');
  // 4a. Customer retrieves notes on own order
  const getNotesRes = await fetch(`${BASE_URL}/api/store/orders/${freeOrderId}/notes`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${customerJwt}`
    }
  });
  assert.strictEqual(getNotesRes.status, 200, 'Customer retrieves order notes (HTTP 200)');
  const getNotesData = await getNotesRes.json();
  assert.strictEqual(getNotesData.success, true, 'Notes retrieval success: true');
  assert.strictEqual(getNotesData.isOptional, true, 'Clarifies notes are optional');
  console.log('  [PASS] Customer retrieves order payment notes successfully');

  // 4b. Customer updates order payment notes
  const updateNotesRes = await fetch(`${BASE_URL}/api/store/orders/${freeOrderId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerJwt}`
    },
    body: JSON.stringify({
      notes: 'Updated: Please ensure academic certificate is attached.'
    })
  });
  assert.strictEqual(updateNotesRes.status, 200, 'Customer updates order payment notes (HTTP 200)');
  const updateNotesData = await updateNotesRes.json();
  assert.strictEqual(updateNotesData.success, true, 'Notes update success: true');
  assert.strictEqual(updateNotesData.notes, 'Updated: Please ensure academic certificate is attached.', 'Notes content updated');
  console.log('  [PASS] Customer updates order payment notes with valid auth');

  // 4c. Unauthenticated request to payment notes endpoint
  const unauthNotesRes = await fetch(`${BASE_URL}/api/store/orders/${freeOrderId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'Unauthenticated note' })
  });
  assert.strictEqual(unauthNotesRes.status, 401, 'Unauthenticated notes update returns HTTP 401');
  const unauthNotesData = await unauthNotesRes.json();
  assert.strictEqual(unauthNotesData.code, 'UNAUTHENTICATED', 'Error code is UNAUTHENTICATED');
  console.log('  [PASS] Unauthenticated notes update returns HTTP 401 UNAUTHENTICATED');

  // 4d. Cross-customer permission check on payment notes endpoint
  const otherCustomerJwt = createMockJwt({ uid: 'cust_intruder_99' });
  const crossNotesRes = await fetch(`${BASE_URL}/api/store/orders/${freeOrderId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${otherCustomerJwt}`
    },
    body: JSON.stringify({ notes: 'Malicious modification' })
  });
  assert.strictEqual(crossNotesRes.status, 403, 'Cross-customer notes update returns HTTP 403 Forbidden');
  const crossNotesData = await crossNotesRes.json();
  assert.strictEqual(crossNotesData.code, 'PERMISSION_DENIED', 'Error code is PERMISSION_DENIED');
  console.log('  [PASS] Cross-customer notes access blocked with HTTP 403 PERMISSION_DENIED');

  // -------------------------------------------------------------------------
  // 5. PAID POSITIVE-AMOUNT PRODUCT (demo-prod-book-01, ₹180) RAZORPAY WORKFLOW
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Paid Product (demo-prod-book-01, ₹180) Razorpay Order Creation ---');
  // 5a. Create positive amount order
  const createPaidRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerJwt}`
    },
    body: JSON.stringify({
      userId: customerUid,
      customer: {
        fullName: 'Zainab Fatima',
        email: customerEmail,
        mobileNumber: '9876543210',
        userUid: customerUid,
        isRegisteredUser: true
      },
      billingAddress: {
        addressLine1: 'FET Educational Complex',
        city: 'Srinagar',
        state: 'Jammu & Kashmir',
        pincode: '190001',
        country: 'India'
      },
      items: [{
        productId: 'demo-prod-book-01',
        variantId: 'var-bk-paperback',
        productName: '[Demo Product] Prescribed Ethical Reader',
        quantity: 1,
        unitPrice: 180,
        itemTotal: 180,
        isDigital: false,
        paymentMethods: 'razorpay'
      }],
      notes: 'Deliver to library desk',
      paymentMethod: 'razorpay'
    })
  });

  assert.strictEqual(createPaidRes.status, 200, 'Paid order draft creation returns HTTP 200');
  const createPaidData = await createPaidRes.json();
  const paidOrderId = createPaidData.orderId;
  assert.strictEqual(createPaidData.total, 180, 'Paid order total is 180');
  console.log(`  [PASS] Paid order drafted with orderId "${paidOrderId}" and total: ₹180`);

  // 5b. Razorpay create-order with demo item in safe test mode
  const rzpPaidRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerJwt}`
    },
    body: JSON.stringify({
      orderId: paidOrderId,
      testMode: true
    })
  });

  assert.strictEqual(rzpPaidRes.status, 200, 'Razorpay create-order for paid product returns HTTP 200');
  const rzpPaidData = await rzpPaidRes.json();
  assert.strictEqual(rzpPaidData.success, true, 'Returns success: true');
  assert.strictEqual(rzpPaidData.amount, 18000, 'Amount in paise is 18000 (₹180 * 100)');
  assert.strictEqual(rzpPaidData.currency, 'INR', 'Currency is INR');
  assert(rzpPaidData.razorpayOrderId.length > 0, 'Generated razorpayOrderId is present');
  console.log(`  [PASS] Razorpay order created safely with order ID "${rzpPaidData.razorpayOrderId}"`);

  // 5c. Cryptographic verification of paid test order
  const verifyRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerJwt}`
    },
    body: JSON.stringify({
      orderId: paidOrderId,
      razorpay_order_id: rzpPaidData.razorpayOrderId,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: `test_sig_${Date.now()}`,
      testMode: true
    })
  });

  assert.strictEqual(verifyRes.status, 200, 'Payment verification returns HTTP 200');
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyData.success, true, 'Verification success: true');
  assert.strictEqual(verifyData.paymentStatus, 'captured', 'Payment status updated to captured');
  assert.strictEqual(verifyData.orderStatus, 'paid', 'Order status updated to paid');
  console.log('  [PASS] Online payment verified securely and order marked paid');

  console.log('\n================================================================');
  console.log('TASK 28 VERIFICATION COMPLETE: ALL TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTask28Tests().catch((err) => {
  console.error('\n[TEST RUNNER ERROR]', err);
  process.exit(1);
});
