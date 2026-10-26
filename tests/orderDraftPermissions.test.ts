/**
 * @license
 * Automated Verification Suite for Task 22:
 * Order Draft Notes Optionality, Authorization & RBAC Verification
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

async function runTestSuite() {
  console.log('\n--- STARTING TASK 22 ORDER DRAFT NOTES & RBAC VERIFICATION ---\n');

  const testUserId = `test-user-${Date.now()}`;
  const otherUserId = `intruder-user-${Date.now()}`;

  // 1. Test: Creating a draft when notes are omitted
  console.log('1. Testing draft creation when notes are omitted:');
  const createNoNotesRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId
    },
    body: JSON.stringify({
      userId: testUserId,
      customer: {
        fullName: 'Zainab Fatima',
        email: 'zainab.fatima@fetindia.org',
        mobileNumber: '9876543210'
      },
      billingAddress: {
        addressLine1: 'Main Bazaar',
        city: 'Kargil',
        state: 'Ladakh',
        pincode: '194103'
      },
      shippingAddress: {
        addressLine1: 'Main Bazaar',
        city: 'Kargil',
        state: 'Ladakh',
        pincode: '194103'
      },
      items: [
        {
          productId: 'demo-prod-islamic-wear-01',
          variantId: 'var-iw-m-black',
          quantity: 1
        }
      ]
    })
  });

  const cType1 = createNoNotesRes.headers.get('content-type') || '';
  assert(cType1.includes('application/json'), 'Response is valid application/json');
  assert(createNoNotesRes.status === 200, 'Draft creation succeeded with HTTP 200 without notes');
  const data1 = await createNoNotesRes.json();
  assert(data1.success === true, 'Success flag is true');
  assert(typeof data1.orderId === 'string' && data1.orderId.length > 0, 'Valid orderId generated');
  assert(typeof data1.draftId === 'string' && data1.draftId.length > 0, 'draftId alias available for subsequent steps');
  assert(data1.notes === '' || data1.notes === undefined, 'Notes field safely empty without error');
  assert(data1.deliveryNotes === '' || data1.deliveryNotes === undefined, 'Delivery notes safely empty without error');
  const orderId1 = data1.orderId;

  // 2. Test: Reading draft notes when notes were omitted
  console.log('\n2. Testing draft notes retrieval when notes were omitted:');
  const getNotes1Res = await fetch(`${BASE_URL}/api/store/orders/${orderId1}/notes`, {
    method: 'GET',
    headers: { 'x-user-id': testUserId }
  });
  assert(getNotes1Res.status === 200, 'GET /notes returns HTTP 200');
  const getNotes1Data = await getNotes1Res.json();
  assert(getNotes1Data.success === true, 'GET /notes returns success: true');
  assert(getNotes1Data.isOptional === true, 'Response clarifies notes are optional');
  assert(getNotes1Data.hasNotes === false, 'hasNotes correctly indicates false');

  // 3. Test: Creating a draft when notes are supplied
  console.log('\n3. Testing draft creation when notes are supplied:');
  const testNotesText = 'Please deliver between 10am and 1pm to the FET Academic Library desk.';
  const createWithNotesRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId
    },
    body: JSON.stringify({
      userId: testUserId,
      customer: {
        fullName: 'Zainab Fatima',
        email: 'zainab.fatima@fetindia.org',
        mobileNumber: '9876543210'
      },
      billingAddress: {
        addressLine1: 'Main Bazaar',
        city: 'Kargil',
        state: 'Ladakh',
        pincode: '194103'
      },
      shippingAddress: {
        addressLine1: 'Main Bazaar',
        city: 'Kargil',
        state: 'Ladakh',
        pincode: '194103'
      },
      items: [
        {
          productId: 'demo-prod-islamic-wear-01',
          variantId: 'var-iw-m-black',
          quantity: 1
        }
      ],
      notes: testNotesText,
      deliveryNotes: testNotesText
    })
  });
  assert(createWithNotesRes.status === 200, 'Draft created with HTTP 200 when notes supplied');
  const data2 = await createWithNotesRes.json();
  assert(data2.notes === testNotesText, 'Notes matched supplied text');
  assert(data2.deliveryNotes === testNotesText, 'Delivery notes matched supplied text');
  const orderId2 = data2.orderId;

  // 4. Test: Reading draft notes when notes are supplied
  console.log('\n4. Testing draft notes retrieval when notes were supplied:');
  const getNotes2Res = await fetch(`${BASE_URL}/api/store/orders/${orderId2}/notes`, {
    method: 'GET',
    headers: { 'x-user-id': testUserId }
  });
  assert(getNotes2Res.status === 200, 'GET /notes returns HTTP 200');
  const getNotes2Data = await getNotes2Res.json();
  assert(getNotes2Data.notes === testNotesText, 'Retrieved notes match supplied notes');
  assert(getNotes2Data.hasNotes === true, 'hasNotes reflects true');

  // 5. Test: Updating notes on an existing draft
  console.log('\n5. Testing PATCH updating notes on an existing draft:');
  const updatedNotes = 'Updated: Please call upon reaching Gate 2.';
  const patchRes = await fetch(`${BASE_URL}/api/store/orders/${orderId2}/notes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId
    },
    body: JSON.stringify({ notes: updatedNotes })
  });
  assert(patchRes.status === 200, 'PATCH notes succeeded with HTTP 200');
  const patchData = await patchRes.json();
  assert(patchData.notes === updatedNotes, 'Updated notes verified in response');

  // 6. Test: Rejecting unauthenticated requests
  console.log('\n6. Testing rejection of unauthenticated requests:');
  const unauthGetRes = await fetch(`${BASE_URL}/api/store/orders/${orderId1}/notes`, {
    method: 'GET'
  });
  assert(unauthGetRes.status === 401, 'Unauthenticated GET /notes rejected with HTTP 401');
  const unauthGetData = await unauthGetRes.json();
  assert(unauthGetData.code === 'UNAUTHENTICATED', 'Error code is UNAUTHENTICATED');
  assert(unauthGetData.category === 'unauthenticated', 'Category is unauthenticated');

  const unauthCreateRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: { fullName: 'Anonymous' } })
  });
  assert(unauthCreateRes.status === 401, 'Unauthenticated POST /orders/create rejected with HTTP 401');

  // 7. Test: Rejecting unauthorized access to another customer\'s draft
  console.log('\n7. Testing rejection of unauthorized access to another customer draft:');
  const unauthzGetRes = await fetch(`${BASE_URL}/api/store/orders/${orderId1}/notes`, {
    method: 'GET',
    headers: { 'x-user-id': otherUserId }
  });
  assert(unauthzGetRes.status === 403, 'Unauthorized access rejected with HTTP 403');
  const unauthzGetData = await unauthzGetRes.json();
  assert(unauthzGetData.code === 'PERMISSION_DENIED', 'Error code is PERMISSION_DENIED');
  assert(unauthzGetData.category === 'permission_denied', 'Category is permission_denied');

  const unauthzPatchRes = await fetch(`${BASE_URL}/api/store/orders/${orderId1}/notes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': otherUserId
    },
    body: JSON.stringify({ notes: 'Malicious modification' })
  });
  assert(unauthzPatchRes.status === 403, 'Unauthorized PATCH rejected with HTTP 403');

  // 8. Test: Distinct validation error handling
  console.log('\n8. Testing distinct validation error handling:');
  const validationErrRes = await fetch(`${BASE_URL}/api/store/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserId
    },
    body: JSON.stringify({
      userId: testUserId,
      customer: {
        fullName: '',
        email: 'invalid-email',
        mobileNumber: '123'
      },
      items: []
    })
  });
  assert(validationErrRes.status === 400, 'Invalid payload returns HTTP 400 Bad Request');
  const validationErrData = await validationErrRes.json();
  assert(Boolean(validationErrData.error), 'Validation returns clear error description');
  assert(!validationErrData.error.toLowerCase().includes('permission'), 'Validation error does NOT mislabel as permissions error');

  // 9. Test: Valid JSON responses across all paths (confirming no HTML returned)
  console.log('\n9. Testing JSON-only guarantees (confirming no HTML-as-JSON errors):');
  const endpointsToTest = [
    { url: `${BASE_URL}/api/store/orders/create`, method: 'POST', body: '{}' },
    { url: `${BASE_URL}/api/store/orders/validate`, method: 'POST', body: '{}' },
    { url: `${BASE_URL}/api/store/orders/invalid-id/notes`, method: 'GET' }
  ];

  for (const ep of endpointsToTest) {
    const res = await fetch(ep.url, {
      method: ep.method,
      headers: { 'Content-Type': 'application/json' },
      body: ep.method !== 'GET' ? ep.body : undefined
    });
    const cType = res.headers.get('content-type') || '';
    assert(cType.includes('application/json'), `Endpoint ${ep.method} ${ep.url} returns JSON content-type`);
    const parsed = await res.json();
    assert(typeof parsed === 'object' && parsed !== null, `Endpoint returns structured JSON object`);
  }

  console.log(`\n--- ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! ---\n`);
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
