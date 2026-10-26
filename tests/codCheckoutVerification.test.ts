/**
 * @license
 * Automated Verification Suite for Task 25: Cash on Delivery (COD) Purchases
 * Fatimyah Educational Trust India (FET India)
 *
 * Exercises all 8 required development test scenarios:
 * 1. A successful COD order
 * 2. A product that does not permit COD
 * 3. Missing customer or delivery information
 * 4. Insufficient stock
 * 5. An unauthenticated or unauthorized request
 * 6. A repeated order submission
 * 7. Correct order and payment statuses in the dashboard
 * 8. Correct customer confirmation and email behavior
 */

import { renderStoreOrderEmail, OrderEmailContext } from '../src/services/storeEmailNotificationService';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Test failed: ${testName} - ${detail || ''}`);
  }
}

async function runTask25CodVerification() {
  console.log('\n================================================================');
  console.log('TASK 25 — CASH ON DELIVERY (COD) PURCHASES VERIFICATION SUITE');
  console.log('================================================================\n');

  let testOrderId = '';
  let testOrderNumber = '';
  const testUserId = `cod_cust_${Date.now()}`;

  // =================================================================
  // SCENARIO 1: A Successful COD Order
  // =================================================================
  console.log('--- 1. Testing a Successful COD Order ---');

  const validCustomer = {
    fullName: 'Sayyid Mehdi Rizvi',
    email: 'mehdi.rizvi@example.com',
    mobileNumber: '9906543210'
  };

  const validBilling = {
    addressLine1: 'Flat 12, Gulshan Heights',
    addressLine2: 'Near Imamia Hall',
    city: 'Srinagar',
    state: 'Jammu & Kashmir',
    pincode: '190003',
    landmark: 'Central Library Road'
  };

  const codPayload = {
    userId: testUserId,
    paymentMethod: 'COD',
    customer: validCustomer,
    billingAddress: validBilling,
    shippingAddress: validBilling,
    items: [
      {
        productId: 'demo-prod-islamic-wear-01',
        variantId: 'var-iw-m-black',
        quantity: 1
      }
    ],
    notes: 'Please deliver after 2 PM. Cash ready.'
  };

  const createRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(codPayload)
  });

  const createData = await createRes.json();
  assert(createRes.status === 200, 'COD order endpoint returns HTTP 200 OK');
  assert(createData.success === true, 'Order creation response indicates success');
  assert(Boolean(createData.orderId), 'Real Firestore orderId generated');
  assert(Boolean(createData.orderNumber), 'Human-readable orderNumber generated');
  assert(createData.orderNumber.startsWith('FET-ORD-'), 'Order number matches official FET format');
  assert(createData.paymentMethod === 'COD', 'Payment method saved as "COD"');
  assert(createData.paymentStatus === 'unpaid', 'Payment status is "unpaid" (never marked paid on creation)');
  assert(createData.orderStatus === 'processing', 'Order status is "processing" (authoritatively placed/confirmed)');
  assert(createData.total === 1450, 'Authoritative price calculated correctly (₹1,450)');
  assert(createData.message.includes('placed successfully with Cash on Delivery'), 'Response contains clear COD confirmation message');

  testOrderId = createData.orderId;
  testOrderNumber = createData.orderNumber;
  console.log(`   -> Created Order ID: ${testOrderId}, Order Number: ${testOrderNumber}`);

  // Customer fetches own placed order
  const getOrderRes = await fetch(`${BASE_URL}/api/store/orders/${testOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId
    }
  });
  const getOrderData = await getOrderRes.json();
  assert(getOrderRes.status === 200, 'Customer can retrieve placed COD order (HTTP 200)');
  assert(getOrderData.order.id === testOrderId, 'Retrieved order ID matches created order');
  assert(getOrderData.order.paymentMethod === 'COD', 'Retrieved order paymentMethod is COD');
  assert(getOrderData.order.paymentStatus === 'unpaid', 'Retrieved order paymentStatus is unpaid');
  assert(getOrderData.order.orderStatus === 'processing', 'Retrieved order status is processing');
  assert(getOrderData.order.notes === 'Please deliver after 2 PM. Cash ready.', 'Delivery notes preserved');

  // =================================================================
  // SCENARIO 2: A Product that Does Not Permit COD
  // =================================================================
  console.log('\n--- 2. Testing a Product that Does Not Permit COD ---');

  // Product demo-prod-book-01 only permits 'razorpay'
  const nonCodValidateRes = await fetch(`${BASE_URL}/api/store/orders/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }],
      customer: validCustomer,
      billingAddress: validBilling
    })
  });
  const nonCodValidateData = await nonCodValidateRes.json();
  assert(nonCodValidateRes.status === 200, 'Non-COD product cart validates with HTTP 200');
  assert(nonCodValidateData.allowedPaymentMethods?.includes('razorpay'), 'Allowed methods include razorpay');
  assert(!nonCodValidateData.allowedPaymentMethods?.includes('COD'), 'Allowed methods exclude COD');

  // Attempting to place COD order with razorpay-only product
  const nonCodOrderRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: testUserId,
      paymentMethod: 'COD',
      customer: validCustomer,
      billingAddress: validBilling,
      items: [{ productId: 'demo-prod-book-01', variantId: 'var-bk-paperback', quantity: 1 }]
    })
  });
  const nonCodOrderData = await nonCodOrderRes.json();
  assert(nonCodOrderRes.status === 400, 'Backend rejects COD request for online-only product (HTTP 400)');
  assert(nonCodOrderData.error.includes('Cash on Delivery (COD) is not available'), 'Rejection error explains COD is not available');

  // =================================================================
  // SCENARIO 3: Missing Customer or Delivery Information
  // =================================================================
  console.log('\n--- 3. Testing Missing Customer or Delivery Information ---');

  // 3a. Missing customer full name
  const resMissingName = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      customer: { ...validCustomer, fullName: '' }
    })
  });
  assert(resMissingName.status === 400, 'Missing customer full name rejected with HTTP 400');

  // 3b. Missing or invalid customer email
  const resMissingEmail = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      customer: { ...validCustomer, email: 'not-a-valid-email' }
    })
  });
  assert(resMissingEmail.status === 400, 'Invalid customer email rejected with HTTP 400');

  // 3c. Invalid mobile number (< 10 digits)
  const resInvalidMobile = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      customer: { ...validCustomer, mobileNumber: '12345' }
    })
  });
  assert(resInvalidMobile.status === 400, 'Invalid mobile number rejected with HTTP 400');

  // 3d. Missing address line 1
  const resMissingAddress = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      billingAddress: { ...validBilling, addressLine1: '' }
    })
  });
  assert(resMissingAddress.status === 400, 'Missing address line 1 rejected with HTTP 400');

  // 3e. Missing city or state
  const resMissingCity = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      billingAddress: { ...validBilling, city: '' }
    })
  });
  assert(resMissingCity.status === 400, 'Missing city rejected with HTTP 400');

  // 3f. Invalid pincode (not 6 digits)
  const resInvalidPincode = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      billingAddress: { ...validBilling, pincode: '190' }
    })
  });
  assert(resInvalidPincode.status === 400, 'Invalid PIN code rejected with HTTP 400');

  // 3g. Empty items array
  const resEmptyItems = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      items: []
    })
  });
  assert(resEmptyItems.status === 400, 'Empty items array rejected with HTTP 400');

  // =================================================================
  // SCENARIO 4: Insufficient Stock
  // =================================================================
  console.log('\n--- 4. Testing Insufficient Stock ---');

  // Quantity 999 exceeds available stock of 12 for var-iw-m-black
  const resOverStock = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      items: [
        {
          productId: 'demo-prod-islamic-wear-01',
          variantId: 'var-iw-m-black',
          quantity: 999
        }
      ]
    })
  });
  const overStockData = await resOverStock.json();
  assert(resOverStock.status === 400, 'Excess quantity rejected with HTTP 400');
  assert(overStockData.error.includes('exceeds available stock') || overStockData.error.includes('order limit'), 'Error describes stock or order limit constraint');

  // Non-positive or zero quantity
  const resZeroStock = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      items: [
        {
          productId: 'demo-prod-islamic-wear-01',
          variantId: 'var-iw-m-black',
          quantity: 0
        }
      ]
    })
  });
  assert(resZeroStock.status === 400, 'Zero quantity rejected with HTTP 400');

  // =================================================================
  // SCENARIO 5: An Unauthenticated or Unauthorized Request
  // =================================================================
  console.log('\n--- 5. Testing Unauthenticated or Unauthorized Requests ---');

  // 5a. Order creation without userId
  const resNoUser = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      userId: ''
    })
  });
  const noUserData = await resNoUser.json();
  assert(resNoUser.status === 401, 'Unauthenticated order creation rejected with HTTP 401');
  assert(noUserData.code === 'UNAUTHENTICATED', 'Error code is UNAUTHENTICATED');

  // 5b. Customer B attempting to access Customer A's order
  const resUnauthorizedRead = await fetch(`${BASE_URL}/api/store/orders/${testOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'unauthorized_stranger_user'
    }
  });
  const unauthReadData = await resUnauthorizedRead.json();
  assert(resUnauthorizedRead.status === 403, 'Unauthorized customer access rejected with HTTP 403');
  assert(unauthReadData.code === 'PERMISSION_DENIED', 'Error code is PERMISSION_DENIED');

  // 5c. Unauthorized user attempting to record staff payment collection
  const resUnauthorizedPayment = await fetch(`${BASE_URL}/api/store/orders/record-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: testOrderId,
      actorUid: 'unauthorized_customer_123',
      notes: 'Fake payment collection attempt'
    })
  });
  assert(resUnauthorizedPayment.status === 403, 'Unauthorized payment collection rejected with HTTP 403');

  // =================================================================
  // SCENARIO 6: A Repeated Order Submission (Idempotency & Duplicate Prevention)
  // =================================================================
  console.log('\n--- 6. Testing Repeated Order Submission ---');

  const clientRequestId = `cod_req_${Date.now()}_abc`;

  // First submission
  const firstSubmissionRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      clientRequestId
    })
  });
  const firstData = await firstSubmissionRes.json();
  assert(firstSubmissionRes.status === 200, 'Initial submission succeeds with HTTP 200');
  assert(Boolean(firstData.orderId), 'First submission generated orderId');

  const dedupOrderId = firstData.orderId;
  const dedupOrderNumber = firstData.orderNumber;

  // Repeated submission with exact same clientRequestId
  const retrySubmissionRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...codPayload,
      clientRequestId
    })
  });
  const retryData = await retrySubmissionRes.json();
  assert(retrySubmissionRes.status === 200, 'Retry submission succeeds with HTTP 200');
  assert(retryData.orderId === dedupOrderId, 'Retry returns EXACT same orderId as first submission');
  assert(retryData.orderNumber === dedupOrderNumber, 'Retry returns EXACT same orderNumber');
  assert(retryData.message.includes('already registered') || retryData.message.includes('duplicate request safely handled'),
    'Duplicate submission returns safe idempotency confirmation message');

  // Rapid double click simulation with another clientRequestId
  const rapidRequestId = `cod_rapid_${Date.now()}`;
  const [rapid1, rapid2] = await Promise.all([
    fetch(`${BASE_URL}/api/store/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...codPayload, clientRequestId: rapidRequestId })
    }).then(r => r.json()),
    fetch(`${BASE_URL}/api/store/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...codPayload, clientRequestId: rapidRequestId })
    }).then(r => r.json())
  ]);

  assert(rapid1.orderId === rapid2.orderId, 'Concurrent duplicate submissions resolve to the identical single order');

  // =================================================================
  // SCENARIO 7: Correct Order and Payment Statuses in Dashboard & Staff Collection
  // =================================================================
  console.log('\n--- 7. Testing Order & Payment Statuses in Dashboard and Staff Collection ---');

  // Store Manager/Admin reads the order
  const adminViewRes = await fetch(`${BASE_URL}/api/store/orders/${testOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'admin',
      'x-user-roles': 'super_admin,store_manager'
    }
  });
  const adminViewData = await adminViewRes.json();
  assert(adminViewRes.status === 200, 'Store Manager/Super Admin retrieves order details (HTTP 200)');
  assert(adminViewData.order.paymentMethod === 'COD', 'Dashboard order paymentMethod is COD');
  assert(adminViewData.order.paymentStatus === 'unpaid', 'Payment status is UNPAID prior to staff confirmation');
  assert(adminViewData.order.orderStatus === 'processing', 'Order status is "processing" (visible in orders dashboard)');

  // Authorized staff records cash collection upon physical delivery
  const staffCollectRes = await fetch(`${BASE_URL}/api/store/orders/record-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: testOrderId,
      actorUid: 'admin',
      paymentMethod: 'COD',
      notes: 'Cash of ₹1,450 collected by courier and reconciled at store desk.'
    })
  });
  const staffCollectData = await staffCollectRes.json();
  assert(staffCollectRes.status === 200, 'Authorized staff payment collection succeeds with HTTP 200');
  assert(staffCollectData.success === true, 'Staff collection response indicates success');
  assert(staffCollectData.paymentStatus === 'captured', 'Payment status upgraded to "captured" after staff confirmation');

  // Verify updated order record
  const postPaymentRes = await fetch(`${BASE_URL}/api/store/orders/${testOrderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId
    }
  });
  const postPaymentData = await postPaymentRes.json();
  assert(postPaymentData.order.paymentStatus === 'captured', 'Stored order record reflects captured payment status');
  assert(Boolean(postPaymentData.order.paidAt), 'Timestamp paidAt recorded on the order');

  // =================================================================
  // SCENARIO 8: Correct Customer Confirmation and Email Behavior
  // =================================================================
  console.log('\n--- 8. Testing Customer Confirmation and Email Behavior ---');

  // Check email template rendering for order_received
  const emailContext: OrderEmailContext = {
    orderId: testOrderId,
    orderNumber: testOrderNumber,
    eventType: 'order_received',
    customerName: validCustomer.fullName,
    customerEmail: validCustomer.email,
    total: 1450,
    itemCount: 1,
    items: [
      {
        productName: '[Demo Product] Premium Modest Abaya & Prayer Set',
        variantName: 'Size M (54) / Classic Black',
        quantity: 1,
        unitPrice: 1450,
        itemTotal: 1450
      }
    ],
    city: validBilling.city,
    state: validBilling.state,
    pincode: validBilling.pincode,
    createdAt: new Date().toISOString()
  };

  const renderedEmail = renderStoreOrderEmail(emailContext);
  assert(Boolean(renderedEmail.subject), 'Order confirmation email subject generated');
  assert(renderedEmail.subject.includes(testOrderNumber), 'Email subject contains correct order number');
  assert(renderedEmail.subject.includes('Confirmed') || renderedEmail.subject.includes('Order'), 'Email subject states order confirmation');
  assert(renderedEmail.htmlContent.includes(validCustomer.fullName), 'Email body contains customer name');
  assert(renderedEmail.htmlContent.includes('₹1,450'), 'Email body contains authoritative total');
  assert(renderedEmail.htmlContent.includes('[Demo Product] Premium Modest Abaya'), 'Email body contains ordered item name');
  assert(renderedEmail.htmlContent.includes('Fatimyah Educational Trust India'), 'Email body contains FET India branding');
  assert(!renderedEmail.htmlContent.toLowerCase().includes('order draft and placement intent'),
    'Email copy confirms actual order placement rather than draft intent');

  console.log('\n================================================================');
  console.log(`TASK 25 COD VERIFICATION COMPLETE: ALL ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED!`);
  console.log('================================================================\n');
}

runTask25CodVerification().catch((err) => {
  console.error('\nVerification suite encountered an error:', err);
  process.exit(1);
});
