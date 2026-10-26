/**
 * @license
 * Task 31 — FET India Store End-to-End Quality Assurance Verification Suite
 * Fatimyah Educational Trust India (FET India)
 *
 * Comprehensive End-to-End QA Review covering:
 * 1. Product Data Consistency (Clothing, Physical Books, Digital Books, Perfumes, Attribute Preservation)
 * 2. Purchase & Payment Rules (COD unpaid -> collected, Razorpay HMAC verification, conflict detection, Free products)
 * 3. Inventory & Duplicate-Order Protection (Stock validation, concurrency mutex oversell protection, clientRequestId idempotency)
 * 4. Customer Experience & Administrator Order Management (Dashboard retrieval, status updates, clean errors without secrets)
 * 5. Security & Regression Checks (Authentication, RBAC authorization, digital download security, input validation)
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

// Generate valid test JWT token for store auth
function generateTestToken(uid: string, email: string, role: string = 'customer'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      uid,
      user_id: uid,
      sub: uid,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', 'test_secret_store_key').update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function runStoreEndToEndQASuite() {
  console.log('\n================================================================');
  console.log('TASK 31 — FET INDIA STORE END-TO-END QUALITY ASSURANCE SUITE');
  console.log('================================================================\n');

  const customerAliceToken = generateTestToken('alice_qa_31', 'alice.qa@fetindia.org', 'customer');
  const customerBobToken = generateTestToken('bob_qa_31', 'bob.qa@fetindia.org', 'customer');
  const adminToken = generateTestToken('store_admin_qa_31', 'store.admin@fetindia.org', 'store_admin');

  // =================================================================
  // SECTION 1: Product Data Consistency & Attribute Preservation
  // =================================================================
  console.log('--- 1. Product Data Consistency & Attribute Verification ---');

  // 1a. Women's Clothing Product Structure & Variant Configuration
  const clothingItem = {
    productId: 'demo-prod-islamic-wear-01',
    variantId: 'var-iw-s-black',
    quantity: 1
  };
  const clothingValRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [clothingItem],
      customer: { fullName: 'Fatima Zahra', email: 'fatima@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'House 12, Shalimar', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  const clothingValData = await clothingValRes.json();
  assert(clothingValRes.status === 200, "Women's clothing validation returns HTTP 200");
  assert(clothingValData.isValid === true, "Women's clothing cart is valid");
  assert(clothingValData.validatedItems?.[0]?.productType === 'merchandise' || clothingValData.validatedItems?.[0]?.productType === 'clothing', "Clothing productType preserved");
  assert(clothingValData.validatedItems?.[0]?.variantName?.includes('Size S'), "Clothing variant size properly resolved");
  assert(clothingValData.validatedItems?.[0]?.variantName?.includes('Classic Black'), "Clothing variant colour properly resolved");

  // 1b. Physical Book Product Structure & Pricing
  // Test requiring variant selection when product has variants
  const unselectedVariantRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'demo-prod-book-01', quantity: 1 }],
      customer: { fullName: 'Ali Raza', email: 'ali@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Bazaar Road', city: 'Kargil', state: 'Ladakh', pincode: '194103' }
    })
  });
  assert(unselectedVariantRes.status === 400, 'Product with variants requires variantId selection (HTTP 400)');

  // Selected Physical Paperback Variant
  const physicalBookItem = {
    productId: 'demo-prod-book-01',
    variantId: 'var-bk-paperback',
    quantity: 1
  };
  const bookValRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [physicalBookItem],
      customer: { fullName: 'Ali Raza', email: 'ali@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Bazaar Road', city: 'Kargil', state: 'Ladakh', pincode: '194103' }
    })
  });
  const bookValData = await bookValRes.json();
  assert(bookValRes.status === 200, 'Physical book validation returns HTTP 200');
  assert(bookValData.isValid === true, 'Physical book cart is valid');
  assert(bookValData.total === 180, 'Physical book price is ₹180');
  assert(bookValData.allowedPaymentMethods?.includes('razorpay'), 'Physical book allows Razorpay');
  assert(bookValData.validatedItems?.[0]?.sku === 'DEMO-BK-ETH-PB', 'Authoritative paperback SKU resolved');

  // 1c. Free Digital Publication / Book Workflow
  const freeDigitalItem = {
    productId: 'demo-prod-publication-01',
    quantity: 1
  };
  const digitalValRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [freeDigitalItem],
      customer: { fullName: 'Zainab Bano', email: 'zainab@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Library St', city: 'Aligarh', state: 'UP', pincode: '202001' }
    })
  });
  const digitalValData = await digitalValRes.json();
  assert(digitalValRes.status === 200, 'Digital publication validation returns HTTP 200');
  assert(digitalValData.isValid === true, 'Digital publication cart is valid');
  assert(digitalValData.total === 0, 'Digital publication total is ₹0');
  assert(digitalValData.isFreeOrder === true, 'isFreeOrder flag is true for ₹0 product');

  // 1d. Perfume Attributes Structure Verification
  // Verify perfume catalog item with bottle size selection (6ml roll-on bottle)
  const perfumeItem = {
    productId: 'demo-prod-perfume-01',
    variantId: 'var-pf-6ml',
    quantity: 1
  };
  const perfumeValRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [perfumeItem],
      customer: { fullName: 'Syed Mehdi', email: 'mehdi@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Old City', city: 'Lucknow', state: 'UP', pincode: '226003' }
    })
  });
  const perfumeValData = await perfumeValRes.json();
  assert(perfumeValRes.status === 200, 'Perfume validation succeeds with HTTP 200');
  assert(perfumeValData.isValid === true, 'Perfume cart is valid');
  assert(perfumeValData.validatedItems?.[0]?.variantAttributes?.Volume === '6ml Roll-on', 'Perfume bottle size volume properly validated');
  assert(perfumeValData.validatedItems?.[0]?.unitPrice === 450, 'Perfume 6ml price is ₹450');

  // =================================================================
  // SECTION 2: Purchase and Payment Rules Verification
  // =================================================================
  console.log('\n--- 2. Purchase and Payment Rules Verification ---');

  // 2a. Cash on Delivery (COD) Purchase Workflow: Must remain unpaid upon creation
  const codClientReqId = `qa31_cod_${Date.now()}`;
  const codOrderRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      clientRequestId: codClientReqId,
      paymentMethod: 'COD',
      items: [{ productId: 'demo-prod-materials-01', quantity: 1 }],
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  const codOrderData = await codOrderRes.json();
  assert(codOrderRes.status === 200, 'COD order creation returns HTTP 200');
  assert(codOrderData.success === true, 'COD order response indicates success: true');
  assert(codOrderData.paymentMethod === 'COD', 'Saved payment method is COD');
  assert(codOrderData.paymentStatus === 'unpaid', 'COD order is strictly UNPAID on creation');
  assert(codOrderData.orderStatus === 'processing', 'COD order status is processing for fulfillment');
  const codOrderId = codOrderData.orderId;

  // 2b. Authorized Staff Payment Collection: Updates payment status to captured
  const staffCollectRes = await fetch(`${BASE_URL}/api/store/orders/record-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: codOrderId,
      actorUid: 'store_manager',
      paymentMethod: 'COD',
      notes: 'Cash received upon delivery package handover.'
    })
  });
  const staffCollectData = await staffCollectRes.json();
  assert(staffCollectRes.status === 200, 'Authorized staff payment collection returns HTTP 200');
  assert(staffCollectData.success === true, 'Staff collection response indicates success');
  assert(staffCollectData.paymentStatus === 'captured', 'Payment status updated to captured');

  // 2c. Product-Level Payment Restrictions: Rejection of COD for Razorpay-only product
  const invalidCodRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      paymentMethod: 'COD',
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }], // demo-prod-book-01 is razorpay only
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  assert(invalidCodRes.status === 400, 'Backend rejects COD request for Razorpay-only product (HTTP 400)');

  // 2d. Incompatible Cart Items: Conflict detection
  const conflictValRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { productId: 'demo-prod-materials-01', quantity: 1 }, // COD only
        { productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }       // Razorpay only
      ],
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  const conflictValData = await conflictValRes.json();
  assert(conflictValRes.status === 400 || conflictValData.isValid === false, 'Incompatible cart items rejected or marked invalid');
  assert(conflictValData.hasPaymentMethodConflict === true, 'hasPaymentMethodConflict flag is true');
  assert(conflictValData.paymentMethodConflictReason?.includes('separate orders'), 'Clear actionable reason provided to user');

  // 2e. Free Product Workflow: Placed without invoking invalid 0-value Razorpay API
  const freeOrderRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      paymentMethod: 'free',
      items: [{ productId: 'demo-prod-publication-01', quantity: 1 }],
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  const freeOrderData = await freeOrderRes.json();
  assert(freeOrderRes.status === 200, 'Free order placed successfully (HTTP 200)');
  assert(freeOrderData.total === 0, 'Total is 0');
  assert(freeOrderData.paymentStatus === 'free', 'Payment status is free');

  // Verify that Razorpay create-order route handles 0-value orders cleanly
  const rzpZeroRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      orderId: freeOrderData.orderId,
      userId: 'alice_qa_31'
    })
  });
  const rzpZeroData = await rzpZeroRes.json();
  assert(rzpZeroRes.status === 200, 'Razorpay endpoint cleanly processes free order draft (HTTP 200)');
  assert(rzpZeroData.isFreeOrder === true, 'isFreeOrder confirmed true without contacting gateway');

  // 2f. Razorpay Online Order & Cryptographic HMAC Verification
  const rzpOrderRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      paymentMethod: 'razorpay',
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }], // ₹180
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  const rzpOrderData = await rzpOrderRes.json();
  assert(rzpOrderRes.status === 200, 'Razorpay order draft created (HTTP 200)');
  assert(rzpOrderData.paymentStatus === 'unpaid', 'Razorpay order remains unpaid before verification');
  const rzpOrderId = rzpOrderData.orderId;

  // Razorpay Gateway Order Preparation
  const rzpPrepRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      orderId: rzpOrderId,
      userId: 'alice_qa_31'
    })
  });
  const rzpPrepData = await rzpPrepRes.json();
  assert(rzpPrepRes.status === 200, 'Razorpay gateway order preparation returns HTTP 200');
  assert(rzpPrepData.amount === 18000, 'Amount in paise is exactly 18000 (₹180 * 100)');
  assert(rzpPrepData.currency === 'INR', 'Currency is INR');
  const gatewayOrderId = rzpPrepData.razorpayOrderId;

  // Reject Tampered Signature
  const tamperedSigRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      orderId: rzpOrderId,
      razorpay_order_id: gatewayOrderId,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: 'tampered_invalid_signature_hex_00000',
      testMode: true
    })
  });
  assert(tamperedSigRes.status === 400, 'Tampered payment signature rejected with HTTP 400');

  // Verify Valid Cryptographic Payment Signature
  const validPaymentId = `pay_qa31_${Date.now()}`;
  const testSecret = 'test_secret_store_key';
  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${gatewayOrderId}|${validPaymentId}`)
    .digest('hex');

  const verifyRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      orderId: rzpOrderId,
      razorpay_order_id: gatewayOrderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSignature,
      testMode: true
    })
  });
  const verifyData = await verifyRes.json();
  assert(verifyRes.status === 200, 'Cryptographic payment verification returns HTTP 200');
  assert(verifyData.success === true, 'Verification confirms success');
  assert(verifyData.paymentStatus === 'captured', 'Payment status updated to captured');
  assert(verifyData.orderStatus === 'paid', 'Order status updated to paid');

  // Replay Attack Prevention
  const replayRes = await fetch(`${BASE_URL}/api/store/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      orderId: codOrderId, // different order trying to reuse same payment ID
      razorpay_order_id: gatewayOrderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSignature,
      testMode: true
    })
  });
  assert(replayRes.status === 409, 'Payment replay attack rejected with HTTP 409 Conflict');

  // =================================================================
  // SECTION 3: Inventory & Duplicate-Order Protection
  // =================================================================
  console.log('\n--- 3. Inventory & Duplicate-Order Protection Verification ---');

  // 3a. Idempotent Retry: Same clientRequestId returns identical order without duplication
  const retryClientReqId = `qa31_dedup_${Date.now()}`;
  const firstReqRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      clientRequestId: retryClientReqId,
      paymentMethod: 'COD',
      items: [{ productId: 'demo-prod-materials-01', quantity: 1 }],
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  const firstReqData = await firstReqRes.json();
  assert(firstReqRes.status === 200, 'First request succeeds');

  const secondReqRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      clientRequestId: retryClientReqId, // identical clientRequestId
      paymentMethod: 'COD',
      items: [{ productId: 'demo-prod-materials-01', quantity: 1 }],
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  const secondReqData = await secondReqRes.json();
  assert(secondReqRes.status === 200, 'Retry request succeeds with HTTP 200');
  assert(secondReqData.orderId === firstReqData.orderId, 'Retry returns EXACT same orderId (no duplicate created)');
  assert(secondReqData.orderNumber === firstReqData.orderNumber, 'Retry returns EXACT same orderNumber');

  // 3b. Concurrent Submission Protection
  const concurrentReqId = `qa31_concurrent_${Date.now()}`;
  const [conRes1, conRes2] = await Promise.all([
    fetch(`${BASE_URL}/api/store/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerAliceToken}`
      },
      body: JSON.stringify({
        userId: 'alice_qa_31',
        clientRequestId: concurrentReqId,
        paymentMethod: 'COD',
        items: [{ productId: 'demo-prod-materials-01', quantity: 1 }],
        customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
        billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
      })
    }),
    fetch(`${BASE_URL}/api/store/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerAliceToken}`
      },
      body: JSON.stringify({
        userId: 'alice_qa_31',
        clientRequestId: concurrentReqId,
        paymentMethod: 'COD',
        items: [{ productId: 'demo-prod-materials-01', quantity: 1 }],
        customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
        billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
      })
    })
  ]);
  const conData1 = await conRes1.json();
  const conData2 = await conRes2.json();
  assert(conData1.orderId === conData2.orderId, 'Concurrent duplicate submissions resolve to the identical single order');

  // 3c. Stock Quantity Exceeded Check
  const excessStockRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      paymentMethod: 'COD',
      items: [{ productId: 'demo-prod-materials-01', quantity: 99999 }], // Exceeds stock
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  assert(excessStockRes.status === 400, 'Excess quantity order rejected with HTTP 400');

  // =================================================================
  // SECTION 4: Customer Experience & Admin Order Management
  // =================================================================
  console.log('\n--- 4. Customer Experience & Administrator Order Management ---');

  // 4a. Customer Retrieves Own Order
  const custGetRes = await fetch(`${BASE_URL}/api/store/orders/${codOrderId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${customerAliceToken}` }
  });
  const custGetData = await custGetRes.json();
  assert(custGetRes.status === 200, 'Customer successfully retrieves own order (HTTP 200)');
  assert(custGetData.orderId === codOrderId, 'Retrieved orderId matches');
  assert(custGetData.paymentMethod === 'COD', 'Retrieved paymentMethod is COD');

  // 4b. Cross-Customer Order Isolation (Bob cannot view Alice's order)
  const bobGetRes = await fetch(`${BASE_URL}/api/store/orders/${codOrderId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${customerBobToken}` }
  });
  assert(bobGetRes.status === 403, 'Unauthorized customer access to another customer order rejected with HTTP 403');

  // 4c. Store Administrator Can View Order in Dashboard
  const adminGetRes = await fetch(`${BASE_URL}/api/store/orders/${codOrderId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminGetData = await adminGetRes.json();
  assert(adminGetRes.status === 200, 'Admin successfully views order in dashboard (HTTP 200)');
  assert(adminGetData.orderNumber !== undefined, 'Admin views correct orderNumber');

  // 4d. Clean Error Messages: Confirm 404/400 errors do not expose secrets or stack traces
  const badRouteRes = await fetch(`${BASE_URL}/api/store/orders/non-existent-order-id-xyz`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const badRouteData = await badRouteRes.json();
  assert(badRouteRes.status === 404, 'Non-existent order returns HTTP 404');
  assert(badRouteData.error !== undefined, 'Clean error message returned');
  assert(!JSON.stringify(badRouteData).includes('stack'), 'No stack trace exposed in response');
  assert(!JSON.stringify(badRouteData).includes('process.env'), 'No environment secrets exposed in response');

  // =================================================================
  // SECTION 5: Security & Input Validation Checks
  // =================================================================
  console.log('\n--- 5. Security & Input Validation Checks ---');

  // 5a. Unauthenticated order creation blocked
  const unauthRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }],
      customer: { fullName: 'No Auth', email: 'noauth@fetindia.org', mobileNumber: '9876543210' }
    })
  });
  assert(unauthRes.status === 401, 'Unauthenticated order creation rejected with HTTP 401');

  // 5b. Invalid customer phone validation
  const badPhoneRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }],
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '123' }, // invalid phone
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '190001' }
    })
  });
  assert(badPhoneRes.status === 400, 'Invalid phone number rejected with HTTP 400');

  // 5c. Invalid PIN code validation
  const badPinRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerAliceToken}`
    },
    body: JSON.stringify({
      userId: 'alice_qa_31',
      items: [{ productId: 'demo-prod-book-01', quantity: 1 }],
      customer: { fullName: 'Alice QA', email: 'alice.qa@fetindia.org', mobileNumber: '9876543210' },
      billingAddress: { addressLine1: 'Main Market', city: 'Srinagar', state: 'J&K', pincode: '12' } // invalid PIN
    })
  });
  assert(badPinRes.status === 400, 'Invalid PIN code rejected with HTTP 400');

  // 5d. Unauthorized payment collection blocked
  const unauthCollectRes = await fetch(`${BASE_URL}/api/store/orders/record-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: codOrderId,
      actorUid: 'unauthorized_hacker',
      paymentMethod: 'COD'
    })
  });
  assert(unauthCollectRes.status === 403, 'Unauthorized staff payment collection blocked with HTTP 403');

  console.log('\n================================================================');
  console.log(`TASK 31 QA REVIEW COMPLETE: ALL ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('================================================================\n');
}

runStoreEndToEndQASuite().catch((err) => {
  console.error('\nQA Suite encountered an unhandled error:', err);
  process.exit(1);
});
