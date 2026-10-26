/**
 * @license
 * Automated Verification Suite for Task 22: Order Draft Workflow & Notes Permissions Fix
 * Fatimyah Educational Trust India (FET India)
 */

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

async function runAllTests() {
  console.log('\n=== STARTING TASK 22 ORDER DRAFT & NOTES VERIFICATION SUITE ===\n');

  // Test 1: Creating a draft when notes are omitted (notes is optional, must not block draft creation)
  console.log('1. Testing order draft creation when notes are omitted:');
  const payloadNoNotes = {
    userId: 'test_cust_owner_01',
    customer: {
      fullName: 'Syed Baqir',
      email: 'baqir.patron@example.com',
      mobileNumber: '9876543210'
    },
    billingAddress: {
      addressLine1: 'Campus Building 4',
      city: 'Srinagar',
      state: 'Jammu & Kashmir',
      pincode: '190001'
    },
    items: [
      {
        productId: 'demo-prod-islamic-wear-01',
        variantId: 'var-iw-m-black',
        quantity: 1
      }
    ],
    dryRun: true
  };

  const res1 = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadNoNotes)
  });

  const cType1 = res1.headers.get('content-type') || '';
  assert(cType1.includes('application/json'), 'Response 1 Content-Type is application/json');
  assert(res1.status === 200, 'Response 1 HTTP status is 200 OK');
  const data1 = await res1.json();
  assert(data1.success === true, 'Draft creation succeeds without notes');
  assert(data1.notes === '' || typeof data1.notes === 'string', 'Notes is safely defined as string even when omitted');
  assert(Boolean(data1.orderId), 'Order ID is generated and returned');

  // Test 2: Creating a draft when notes are supplied
  console.log('\n2. Testing order draft creation when notes are supplied:');
  const payloadWithNotes = {
    ...payloadNoNotes,
    notes: 'Please deliver to administration office during morning hours.',
    deliveryNotes: 'Please deliver to administration office during morning hours.'
  };

  const res2 = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadWithNotes)
  });

  const cType2 = res2.headers.get('content-type') || '';
  assert(cType2.includes('application/json'), 'Response 2 Content-Type is application/json');
  assert(res2.status === 200, 'Response 2 HTTP status is 200 OK');
  const data2 = await res2.json();
  assert(data2.success === true, 'Draft creation succeeds with notes supplied');
  assert(data2.notes === 'Please deliver to administration office during morning hours.', 'Notes accurately preserved');

  // Test 3: Handling a missing or invalid draft ID
  console.log('\n3. Testing handling of missing or invalid draft ID:');
  const res3NotFound = await fetch(`${BASE_URL}/api/store/orders/non_existent_draft_999999`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'test_cust_owner_01'
    }
  });

  const cType3 = res3NotFound.headers.get('content-type') || '';
  assert(cType3.includes('application/json'), 'Response 3 Content-Type is application/json');
  assert(res3NotFound.status === 404, 'Non-existent draft ID returns HTTP 404 Not Found');
  const data3 = await res3NotFound.json();
  assert(data3.code === 'ORDER_NOT_FOUND', 'Response 3 code is ORDER_NOT_FOUND');
  assert(data3.category === 'not_found', 'Response 3 category is not_found');

  // Test 4: Rejecting unauthenticated requests appropriately
  console.log('\n4. Testing rejection of unauthenticated requests:');
  // 4a. Order creation without userId
  const unauthPayload = {
    ...payloadNoNotes,
    userId: ''
  };
  const res4Create = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unauthPayload)
  });
  assert(res4Create.status === 401, 'Unauthenticated draft creation returns HTTP 401 Unauthorized');
  const data4Create = await res4Create.json();
  assert(data4Create.code === 'UNAUTHENTICATED', 'Unauthenticated draft creation code is UNAUTHENTICATED');

  // 4b. Order draft notes update without caller authentication
  const res4Notes = await fetch(`${BASE_URL}/api/store/orders/test_draft_id/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'Sneaky note' })
  });
  assert(res4Notes.status === 401, 'Unauthenticated notes update returns HTTP 401 Unauthorized');
  const data4Notes = await res4Notes.json();
  assert(data4Notes.code === 'UNAUTHENTICATED', 'Unauthenticated notes update code is UNAUTHENTICATED');

  // 4c. Order draft retrieval without user authentication
  const res4Get = await fetch(`${BASE_URL}/api/store/orders/test_draft_id`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  assert(res4Get.status === 401, 'Unauthenticated draft retrieval returns HTTP 401 Unauthorized');
  const data4Get = await res4Get.json();
  assert(data4Get.code === 'UNAUTHENTICATED', 'Unauthenticated draft retrieval code is UNAUTHENTICATED');

  // Test 5: Rejecting unauthorized access to another customer's draft
  console.log('\n5. Testing rejection of unauthorized access to another customer\'s draft:');
  // First, create a real draft with an owner
  const realDraftRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'customer_owner_alice',
      customer: {
        fullName: 'Alice Customer',
        email: 'alice@example.com',
        mobileNumber: '9123456789'
      },
      billingAddress: {
        addressLine1: 'Alice Residence, Plot 9',
        city: 'Jammu',
        state: 'Jammu & Kashmir',
        pincode: '180001'
      },
      items: [
        {
          productId: 'demo-prod-islamic-wear-01',
          variantId: 'var-iw-m-black',
          quantity: 1
        }
      ],
      notes: 'Initial order note by Alice'
    })
  });
  const realDraftData = await realDraftRes.json();
  assert(realDraftRes.status === 200, 'Created authorized test draft for Alice');
  const orderId = realDraftData.orderId;
  assert(Boolean(orderId), 'Alice draft ID returned');

  // 5a. Unauthorized customer Bob tries to read Alice's draft
  const res5BobRead = await fetch(`${BASE_URL}/api/store/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'customer_attacker_bob'
    }
  });
  assert(res5BobRead.status === 403, 'Unauthorized customer read returns HTTP 403 Forbidden');
  const data5BobRead = await res5BobRead.json();
  assert(data5BobRead.code === 'PERMISSION_DENIED', 'Bob read code is PERMISSION_DENIED');
  assert(data5BobRead.category === 'permission_denied', 'Bob read category is permission_denied');

  // 5b. Unauthorized customer Bob tries to modify notes on Alice's draft
  const res5BobNotes = await fetch(`${BASE_URL}/api/store/orders/${orderId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'customer_attacker_bob'
    },
    body: JSON.stringify({
      notes: 'Malicious modification by Bob'
    })
  });
  assert(res5BobNotes.status === 403, 'Unauthorized customer notes edit returns HTTP 403 Forbidden');
  const data5BobNotes = await res5BobNotes.json();
  assert(data5BobNotes.code === 'PERMISSION_DENIED', 'Bob notes edit code is PERMISSION_DENIED');

  // 5c. Authorized customer Alice reads her own draft
  const res5AliceRead = await fetch(`${BASE_URL}/api/store/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'customer_owner_alice'
    }
  });
  assert(res5AliceRead.status === 200, 'Authorized customer Alice reads her draft (HTTP 200)');
  const data5AliceRead = await res5AliceRead.json();
  assert(data5AliceRead.success === true, 'Alice read success is true');
  assert(data5AliceRead.notes === 'Initial order note by Alice', 'Alice notes match');

  // 5d. Authorized customer Alice updates notes on her draft
  const res5AliceNotes = await fetch(`${BASE_URL}/api/store/orders/${orderId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'customer_owner_alice'
    },
    body: JSON.stringify({
      notes: 'Updated delivery instructions by Alice'
    })
  });
  assert(res5AliceNotes.status === 200, 'Authorized customer Alice updates notes (HTTP 200)');
  const data5AliceNotes = await res5AliceNotes.json();
  assert(data5AliceNotes.success === true, 'Alice notes update success is true');
  assert(data5AliceNotes.notes === 'Updated delivery instructions by Alice', 'Notes updated to new value');

  // 5e. Privileged user (store_manager) reads draft
  const res5ManagerRead = await fetch(`${BASE_URL}/api/store/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'store_manager'
    }
  });
  assert(res5ManagerRead.status === 200, 'Privileged store_manager reads draft (HTTP 200)');

  // Test 6: Returning valid JSON for successful and failed API requests
  console.log('\n6. Testing that all successful and failed API responses return valid JSON:');
  const endpointsToTest = [
    { method: 'GET', url: `${BASE_URL}/api/store/orders/validate`, expectedStatus: 405 },
    { method: 'POST', url: `${BASE_URL}/api/store/orders/validate`, body: {}, expectedStatus: 400 },
    { method: 'GET', url: `${BASE_URL}/api/store/orders/create`, expectedStatus: 405 },
    { method: 'POST', url: `${BASE_URL}/api/store/orders/create`, body: { userId: 'u' }, expectedStatus: 400 },
    { method: 'GET', url: `${BASE_URL}/api/store/notifications/status`, expectedStatus: 200 },
    { method: 'GET', url: `${BASE_URL}/api/store/orders/update-status`, expectedStatus: 405 }
  ];

  for (const ep of endpointsToTest) {
    const res = await fetch(ep.url, {
      method: ep.method,
      headers: { 'Content-Type': 'application/json' },
      body: ep.body ? JSON.stringify(ep.body) : undefined
    });
    const cType = res.headers.get('content-type') || '';
    assert(cType.includes('application/json'), `${ep.method} ${ep.url} returns application/json (status ${res.status})`);
    const parsed = await res.json();
    assert(typeof parsed === 'object' && parsed !== null, `${ep.method} ${ep.url} returned parseable JSON object`);
  }

  // Test 7: Confirming that the previous HTML-as-JSON error does not recur
  console.log('\n7. Confirming that previous HTML-as-JSON error does not recur:');
  const unknownApiRoutes = [
    `${BASE_URL}/api/store/nonexistent-subservice`,
    `${BASE_URL}/api/store/unknown-path-v2`,
    `${BASE_URL}/api/nonexistent-service`,
    `${BASE_URL}/api/unknown/something`
  ];

  for (const route of unknownApiRoutes) {
    const res = await fetch(route);
    const cType = res.headers.get('content-type') || '';
    assert(cType.includes('application/json'), `Route ${route} returns JSON, never HTML`);
    assert(!cType.includes('text/html'), `Route ${route} does not return text/html`);
    const json = await res.json();
    assert(json.code === 'API_ROUTE_NOT_FOUND', `Route ${route} returns API_ROUTE_NOT_FOUND`);
  }

  // Also check that querying valid store order route without auth returns JSON 401, not HTML
  const resOrderRoute = await fetch(`${BASE_URL}/api/store/order/some-id`);
  const cTypeOrder = resOrderRoute.headers.get('content-type') || '';
  assert(cTypeOrder.includes('application/json'), 'Store order route returns application/json, never HTML');
  assert(!cTypeOrder.includes('text/html'), 'Store order route does not return text/html');

  console.log(`\n=== ALL ${passedTests}/${totalTests} VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n`);
}

runAllTests().catch((err) => {
  console.error('\nVerification suite encountered fatal error:', err);
  process.exit(1);
});
