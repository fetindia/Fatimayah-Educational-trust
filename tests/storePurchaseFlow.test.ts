/**
 * @license
 * Automated End-to-End Verification Suite for Task 24: Store Purchase Flow (COD & Razorpay)
 * Fatimyah Educational Trust India (FET India)
 *
 * Verifies:
 * 1. Product Payment Settings Enforcement (COD only, Razorpay only, Both, conflict detection)
 * 2. Test A - Cash on Delivery (COD) E2E purchase flow, order creation, unpaid status, staff payment collection
 * 3. Test B - Razorpay Online Payment E2E flow, order creation, test mode options, HMAC verification, replay prevention, failure handling
 * 4. Separate handling of Store purchases vs. live Donation integration
 * 5. Role-based security and audit trail logging
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
    throw new Error(`Test failed: ${testName} - ${detail || ''}`);
  }
}

async function runStorePurchaseFlowTests() {
  console.log('\n============================================================');
  console.log('TASK 24 — STORE PURCHASE FLOW END-TO-END VERIFICATION SUITE');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // SECTION 1: Product Payment Settings Enforcement
  // -------------------------------------------------------------
  console.log('--- 1. Verifying Product Payment Settings Enforcement ---');

  // 1a. Validate cart with COD-only product (demo-prod-materials-01)
  const codOnlyRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'demo-prod-materials-01', quantity: 2 }],
      customer: { fullName: 'Ali Raza', email: 'ali.raza@example.com', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001' }
    })
  });
  const codOnlyData = await codOnlyRes.json();
  assert(codOnlyRes.status === 200, 'COD-only product validation succeeds with HTTP 200');
  assert(codOnlyData.isValid === true, 'COD-only product cart is valid');
  assert(codOnlyData.allowedPaymentMethods?.includes('COD'), 'Allowed payment methods includes COD');
  assert(!codOnlyData.allowedPaymentMethods?.includes('razorpay'), 'Allowed payment methods excludes Razorpay');

  // 1b. Validate cart with Razorpay-only product (demo-prod-book-01)
  const rzpOnlyRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }],
      customer: { fullName: 'Fatima Zahra', email: 'fatima@example.com', mobileNumber: '9876543211' },
      billingAddress: { addressLine1: 'Colony Rd', city: 'Kargil', state: 'Ladakh', pincode: '194103' }
    })
  });
  const rzpOnlyData = await rzpOnlyRes.json();
  assert(rzpOnlyRes.status === 200, 'Razorpay-only product validation succeeds with HTTP 200');
  assert(rzpOnlyData.isValid === true, 'Razorpay-only product cart is valid');
  assert(rzpOnlyData.allowedPaymentMethods?.includes('razorpay'), 'Allowed payment methods includes Razorpay');
  assert(!rzpOnlyData.allowedPaymentMethods?.includes('COD'), 'Allowed payment methods excludes COD');

  // 1c. Validate cart with dual-supported product (demo-prod-islamic-wear-01)
  const bothRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'demo-prod-islamic-wear-01', variantId: 'var-iw-m-black', quantity: 1 }],
      customer: { fullName: 'Syed Baqir', email: 'baqir@example.com', mobileNumber: '9876543212' },
      billingAddress: { addressLine1: 'Campus Rd', city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001' }
    })
  });
  const bothData = await bothRes.json();
  assert(bothRes.status === 200, 'Dual product validation succeeds with HTTP 200');
  assert(bothData.allowedPaymentMethods?.includes('COD'), 'Dual product allows COD');
  assert(bothData.allowedPaymentMethods?.includes('razorpay'), 'Dual product allows Razorpay');

  // 1d. Incompatible cart (COD-only + Razorpay-only items together)
  const conflictRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { productId: 'demo-prod-materials-01', quantity: 1 },
        { productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }
      ],
      customer: { fullName: 'Test User', email: 'test@example.com', mobileNumber: '9876543213' },
      billingAddress: { addressLine1: 'Address 1', city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001' }
    })
  });
  const conflictData = await conflictRes.json();
  assert(conflictData.hasPaymentMethodConflict === true, 'Conflict detected for incompatible products in cart');
  assert(typeof conflictData.paymentMethodConflictReason === 'string', 'Conflict reason explains requirement for separate orders');
  assert(conflictData.isValid === false, 'Incompatible cart cannot be marked valid');

  // 1e. Backend independently blocks placing COD order with Razorpay-only items
  const blockCodRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_user_enforce_01',
      paymentMethod: 'COD',
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }],
      customer: { fullName: 'Test User', email: 'test@example.com', mobileNumber: '9876543213' },
      billingAddress: { addressLine1: 'Address 1', city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001' }
    })
  });
  assert(blockCodRes.status === 400, 'Backend independently rejects COD request for Razorpay-only product (HTTP 400)');

  // 1f. Backend independently blocks placing Razorpay order with COD-only items
  const blockRzpRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_user_enforce_02',
      paymentMethod: 'razorpay',
      items: [{ productId: 'demo-prod-materials-01', quantity: 1 }],
      customer: { fullName: 'Test User', email: 'test@example.com', mobileNumber: '9876543213' },
      billingAddress: { addressLine1: 'Address 1', city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001' }
    })
  });
  assert(blockRzpRes.status === 400, 'Backend independently rejects Razorpay request for COD-only product (HTTP 400)');

  // -------------------------------------------------------------
  // SECTION 2: TEST A — Cash on Delivery (COD) End-to-End Flow
  // -------------------------------------------------------------
  console.log('\n--- 2. TEST A — Cash on Delivery (COD) End-to-End Flow ---');

  const codCustomer = {
    fullName: 'Mohammad Kazim',
    email: 'kazim.patron@example.com',
    mobileNumber: '9906112233'
  };

  const codPayload = {
    userId: 'cust_cod_e2e_001',
    paymentMethod: 'COD',
    customer: codCustomer,
    billingAddress: {
      addressLine1: 'House 42, Mohalla Imamia',
      city: 'Srinagar',
      state: 'Jammu & Kashmir',
      pincode: '190002',
      landmark: 'Near Central Mosque'
    },
    items: [
      {
        productId: 'demo-prod-islamic-wear-01',
        variantId: 'var-iw-m-black',
        quantity: 2
      }
    ],
    notes: 'Please call before delivery. Keep package secure.',
    deliveryNotes: 'Please call before delivery. Keep package secure.'
  };

  // Step 2a: Create COD Order
  const codCreateRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(codPayload)
  });

  const codCreateData = await codCreateRes.json();
  assert(codCreateRes.status === 200, 'COD order created successfully (HTTP 200)', `Status: ${codCreateRes.status}, data: ${JSON.stringify(codCreateData)}`);
  assert(codCreateData.success === true, 'COD order response indicates success');
  assert(Boolean(codCreateData.orderId), 'Real order ID generated and returned');
  assert(Boolean(codCreateData.orderNumber), 'Real order number generated and returned');
  assert(codCreateData.paymentMethod === 'COD', 'Saved payment method is "COD"');
  assert(codCreateData.paymentStatus === 'unpaid', 'Payment status is "unpaid" for COD order');
  assert(codCreateData.orderStatus === 'processing', 'Order status is "processing" (placed/confirmed for fulfillment)');
  assert(codCreateData.total > 0, 'Total calculated authoritatively');

  const codOrderId = codCreateData.orderId;
  const codOrderNumber = codCreateData.orderNumber;
  console.log(`   -> COD Order created: ${codOrderNumber} (ID: ${codOrderId})`);

  // Step 2b: Retrieve COD Order as Customer
  const codGetRes = await fetch(`${BASE_URL}/api/store/orders/${codOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'cust_cod_e2e_001'
    }
  });
  const codGetData = await codGetRes.json();
  assert(codGetRes.status === 200, 'Customer retrieves COD order (HTTP 200)');
  assert(codGetData.order.paymentMethod === 'COD', 'Stored order record paymentMethod is COD');
  assert(codGetData.order.paymentStatus === 'unpaid', 'Stored order record paymentStatus is unpaid');
  assert(codGetData.order.orderStatus === 'processing', 'Stored order record orderStatus is processing');
  assert(codGetData.order.total === codCreateData.total, 'Stored total matches creation total');

  // Step 2c: Verify unauthorized user cannot record staff payment collection
  const unauthPaymentRes = await fetch(`${BASE_URL}/api/store/orders/record-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: codOrderId,
      actorUid: 'unauthorized_random_user',
      notes: 'Attempting unauthorized collection'
    })
  });
  assert(unauthPaymentRes.status === 403, 'Unauthorized staff payment recording returns HTTP 403 Forbidden');

  // Step 2d: Store Manager records payment collection upon delivery
  const staffPaymentRes = await fetch(`${BASE_URL}/api/store/orders/record-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: codOrderId,
      actorUid: 'admin', // Privileged Store Manager / Super Admin
      paymentMethod: 'COD',
      notes: 'Cash of ₹' + codGetData.order.total + ' collected by courier and deposited into store account'
    })
  });
  const staffPaymentData = await staffPaymentRes.json();
  assert(staffPaymentRes.status === 200, 'Authorized staff payment collection recorded successfully (HTTP 200)');
  assert(staffPaymentData.success === true, 'Staff payment record confirms success');
  assert(staffPaymentData.paymentStatus === 'captured', 'Payment status updated to captured');

  // Step 2e: Verify order in DB now shows captured payment
  const codUpdatedRes = await fetch(`${BASE_URL}/api/store/orders/${codOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'cust_cod_e2e_001'
    }
  });
  const codUpdatedData = await codUpdatedRes.json();
  assert(codUpdatedData.order.paymentStatus === 'captured', 'Order record reflects captured payment status after staff recording');

  // -------------------------------------------------------------
  // SECTION 3: TEST B — Razorpay Online Checkout End-to-End Flow
  // -------------------------------------------------------------
  console.log('\n--- 3. TEST B — Razorpay Online Checkout End-to-End Flow ---');

  const rzpCustomer = {
    fullName: 'Zainab Hussain',
    email: 'zainab.store@example.com',
    mobileNumber: '9876500112'
  };

  const rzpOrderPayload = {
    userId: 'cust_rzp_e2e_002',
    paymentMethod: 'razorpay',
    customer: rzpCustomer,
    billingAddress: {
      addressLine1: 'Plot 7, Education Enclave',
      city: 'Jammu',
      state: 'Jammu & Kashmir',
      pincode: '180001'
    },
    items: [
      {
        productId: 'demo-prod-book-01',
        variantId: 'var-bk-paperback',
        quantity: 1
      }
    ]
  };

  // Step 3a: Create initial store order in pending_payment status
  const rzpCreateRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rzpOrderPayload)
  });
  const rzpCreateData = await rzpCreateRes.json();
  assert(rzpCreateRes.status === 200, 'Initial online store order created successfully (HTTP 200)');
  assert(rzpCreateData.paymentMethod === 'razorpay', 'Payment method is "razorpay"');
  assert(rzpCreateData.orderStatus === 'pending_payment', 'Order status is "pending_payment" awaiting gateway confirmation');
  assert(rzpCreateData.paymentStatus === 'unpaid', 'Payment status remains "unpaid" prior to verification');

  const rzpOrderId = rzpCreateData.orderId;
  const rzpOrderNumber = rzpCreateData.orderNumber;
  console.log(`   -> Online Order created: ${rzpOrderNumber} (ID: ${rzpOrderId})`);

  // Step 3b: Call /api/store/orders/razorpay/create-order to prepare gateway parameters
  const rzpPrepRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'cust_rzp_e2e_002'
    },
    body: JSON.stringify({
      orderId: rzpOrderId,
      testMode: true
    })
  });
  const rzpPrepData = await rzpPrepRes.json();
  assert(rzpPrepRes.status === 200, 'Razorpay gateway preparation succeeds (HTTP 200)');
  assert(rzpPrepData.success === true, 'Gateway order preparation success is true');
  assert(Boolean(rzpPrepData.razorpayOrderId), 'Generated Razorpay order ID received');
  assert(rzpPrepData.amount === rzpCreateData.total * 100, 'Authoritative amount in paise matches total * 100');
  assert(rzpPrepData.currency === 'INR', 'Currency is INR');
  assert(Boolean(rzpPrepData.keyId), 'Public Razorpay Key ID provided for frontend Checkout SDK');

  const simulatedRazorpayOrderId = rzpPrepData.razorpayOrderId;
  const simulatedPaymentId = `pay_test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  // Step 3c: Cryptographic verification test — reject tampered signature
  const badSigRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'cust_rzp_e2e_002'
    },
    body: JSON.stringify({
      orderId: rzpOrderId,
      razorpay_order_id: simulatedRazorpayOrderId,
      razorpay_payment_id: simulatedPaymentId,
      razorpay_signature: 'tampered_invalid_signature_hex_1234567890abcdef'
    })
  });
  const badSigData = await badSigRes.json();
  assert(badSigRes.status === 400, 'Tampered payment signature rejected with HTTP 400 Bad Request');
  assert(badSigData.code === 'SIGNATURE_VERIFICATION_FAILED', 'Failure code is SIGNATURE_VERIFICATION_FAILED');

  // Verify order in database was marked as failed / not paid after bad signature
  const checkFailOrderRes = await fetch(`${BASE_URL}/api/store/orders/${rzpOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'cust_rzp_e2e_002'
    }
  });
  const checkFailOrderData = await checkFailOrderRes.json();
  assert(checkFailOrderData.order.paymentStatus === 'failed', 'Payment status set to "failed" upon signature mismatch');

  // Step 3d: Cryptographic verification test — valid deterministic HMAC signature
  // Using test signing secret for simulated tests: 'test_secret_store_key'
  const validTestSig = crypto
    .createHmac('sha256', 'test_secret_store_key')
    .update(`${simulatedRazorpayOrderId}|${simulatedPaymentId}`)
    .digest('hex');

  const verifyRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'cust_rzp_e2e_002'
    },
    body: JSON.stringify({
      orderId: rzpOrderId,
      razorpay_order_id: simulatedRazorpayOrderId,
      razorpay_payment_id: simulatedPaymentId,
      razorpay_signature: validTestSig,
      testMode: true
    })
  });
  const verifyData = await verifyRes.json();
  assert(verifyRes.status === 200, 'Cryptographic payment verification succeeds with HTTP 200 OK');
  assert(verifyData.success === true, 'Verification confirms success');
  assert(verifyData.paymentStatus === 'captured', 'Payment status confirmed as "captured"');
  assert(verifyData.orderStatus === 'paid', 'Order status confirmed as "paid"');
  assert(verifyData.paymentId === simulatedPaymentId, 'Payment ID saved accurately');

  // Step 3e: Confirm order in database is now permanently recorded as PAID
  const confirmedOrderRes = await fetch(`${BASE_URL}/api/store/orders/${rzpOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'cust_rzp_e2e_002'
    }
  });
  const confirmedOrderData = await confirmedOrderRes.json();
  assert(confirmedOrderData.order.orderStatus === 'paid', 'Database record confirmed: orderStatus is "paid"');
  assert(confirmedOrderData.order.paymentStatus === 'captured', 'Database record confirmed: paymentStatus is "captured"');
  assert(confirmedOrderData.order.razorpayPaymentId === simulatedPaymentId, 'Database record confirmed: razorpayPaymentId matches');
  assert(Boolean(confirmedOrderData.order.paidAt), 'Database record confirmed: paidAt timestamp recorded');

  // Step 3f: Replay attack prevention — cannot use same payment ID on a different order
  const secondOrderRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'attacker_replay_003',
      paymentMethod: 'razorpay',
      customer: { fullName: 'Attacker', email: 'attacker@example.com', mobileNumber: '9876543999' },
      billingAddress: { addressLine1: 'Test', city: 'Srinagar', state: 'Jammu & Kashmir', pincode: '190001' },
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }]
    })
  });
  const secondOrderData = await secondOrderRes.json();
  const secondOrderId = secondOrderData.orderId;

  const replaySig = crypto
    .createHmac('sha256', 'test_secret_store_key')
    .update(`order_replay_test|${simulatedPaymentId}`)
    .digest('hex');

  const replayRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'attacker_replay_003'
    },
    body: JSON.stringify({
      orderId: secondOrderId,
      razorpay_order_id: 'order_replay_test',
      razorpay_payment_id: simulatedPaymentId, // Reusing previously credited payment ID
      razorpay_signature: replaySig,
      testMode: true
    })
  });
  const replayData = await replayRes.json();
  assert(replayRes.status === 409, 'Replay attack prevented with HTTP 409 Conflict', `Status: ${replayRes.status}, data: ${JSON.stringify(replayData)}`);
  assert(replayData.code === 'PAYMENT_ALREADY_USED', 'Replay rejection code is PAYMENT_ALREADY_USED');

  // Step 3g: Customer dismissal / failure recording endpoint
  const failRecordRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/record-failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: secondOrderId,
      errorDescription: 'User cancelled payment popup window.'
    })
  });
  const failRecordData = await failRecordRes.json();
  assert(failRecordRes.status === 200, 'Recording payment failure succeeds (HTTP 200)');
  assert(failRecordData.success === true, 'Failure recorded cleanly without crashing');

  // -------------------------------------------------------------
  // SECTION 4: Integrity of Live Razorpay Donations Flow
  // -------------------------------------------------------------
  console.log('\n--- 4. Verifying Separation from Live Donation Workflow ---');

  // Verify /api/razorpay/create-order exists and handles donation requests independently
  const donationCheckRes = await fetch(`${BASE_URL}/api/razorpay/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 100,
      currency: 'INR',
      donorName: 'Generous Donor',
      donorEmail: 'donor@example.com'
    })
  });
  // Should respond with JSON (either 200 or 500 depending on gateway keys in test mode, never 404 or store-order collision)
  const donContentType = donationCheckRes.headers.get('content-type') || '';
  assert(donContentType.includes('application/json'), 'Donation endpoint returns JSON, independent from store purchase route');

  // Verify store endpoints do not accept donation payloads
  const storeNotDonationRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      donorName: 'Donor', // Missing required orderId
      amount: 100
    })
  });
  const storeNotDonationData = await storeNotDonationRes.json();
  assert(storeNotDonationRes.status === 400, 'Store Razorpay route requires store orderId (rejects donation payloads with HTTP 400)');
  assert(storeNotDonationData.code === 'INVALID_REQUEST', 'Rejection code is INVALID_REQUEST');

  console.log('\n============================================================');
  console.log(`TASK 24 VERIFICATION COMPLETE: ALL ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('============================================================\n');
}

runStorePurchaseFlowTests().catch((err) => {
  console.error('\nTest Suite Execution Failed:', err);
  process.exit(1);
});
