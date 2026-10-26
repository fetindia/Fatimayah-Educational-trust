/**
 * @license
 * Automated Verification Suite for Task 17: FET Store Notifications & Brevo Integration
 * Fatimyah Educational Trust India (FET India)
 */

import { 
  renderStoreOrderEmail, 
  sendBrevoStoreOrderEmail, 
  escapeHtml,
  clearDispatchedEmailCacheForTests,
  OrderEmailContext,
  OrderEmailEventType
} from '../src/services/storeEmailNotificationService';

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
  console.log('\n--- STARTING TASK 17 VERIFICATION SUITE ---\n');

  // Test 1: HTML Escaping
  console.log('1. Testing HTML entity sanitization:');
  const unsafeText = '<script>alert("xss")</script> & "special" \'quotes\'';
  const escaped = escapeHtml(unsafeText);
  assert(!escaped.includes('<script>'), 'Removes raw opening script tag');
  assert(escaped.includes('&lt;script&gt;'), 'Encodes opening script tag');
  assert(escaped.includes('&amp;'), 'Encodes ampersand');
  assert(escaped.includes('&quot;special&quot;'), 'Encodes double quotes');

  // Test 2: Email Template Rendering for All Order Events
  console.log('\n2. Testing email template rendering for all order events:');
  const sampleItems = [
    { productName: 'FET Islamic Studies Grade 1', quantity: 2, unitPrice: 250, itemTotal: 500 },
    { productName: 'Duas & Supplications Handbook', quantity: 1, unitPrice: 150, itemTotal: 150 }
  ];

  const events: OrderEmailEventType[] = [
    'order_received',
    'order_processing',
    'order_shipped',
    'order_delivered',
    'order_cancelled'
  ];

  for (const eventType of events) {
    const context: OrderEmailContext = {
      orderId: 'test-ord-001',
      orderNumber: 'FET-ORD-2026-TEST',
      eventType,
      customerName: 'Syed Ali Raza',
      customerEmail: 'ali.raza@example.com',
      total: 650,
      currency: 'INR',
      itemCount: 3,
      items: sampleItems,
      city: 'Srinagar',
      state: 'Jammu & Kashmir',
      pincode: '190001',
      createdAt: '2026-10-10T10:00:00.000Z',
      note: eventType === 'order_cancelled' ? 'Customer requested cancellation.' : undefined
    };

    const rendered = renderStoreOrderEmail(context);
    assert(Boolean(rendered.subject), `Subject generated for "${eventType}"`);
    assert(rendered.subject.includes('FET-ORD-2026-TEST'), `Subject includes order number for "${eventType}"`);
    assert(rendered.htmlContent.includes('FET-ORD-2026-TEST'), `HTML includes order number for "${eventType}"`);
    assert(rendered.htmlContent.includes('Syed Ali Raza'), `HTML includes recipient customer name for "${eventType}"`);
    assert(rendered.htmlContent.includes('FET Islamic Studies Grade 1'), `HTML includes item names for "${eventType}"`);
    assert(rendered.htmlContent.includes('₹650'), `HTML includes total amount for "${eventType}"`);
    assert(rendered.htmlContent.includes('Fatimyah Educational Trust India'), `HTML includes official Trust branding for "${eventType}"`);
    assert(Boolean(rendered.textContent), `Plain text fallback generated for "${eventType}"`);
  }

  // Test 3: Automated Test Mode Safety (Ensures NO real external emails are sent)
  console.log('\n3. Testing automated test mode safety:');
  clearDispatchedEmailCacheForTests();
  const testContext: OrderEmailContext = {
    orderId: 'test-ord-safe-01',
    orderNumber: 'FET-ORD-TEST-SAFE',
    eventType: 'order_received',
    customerName: 'Test Patron',
    customerEmail: 'test.patron@example.com',
    total: 300,
    itemCount: 1,
    items: [{ productName: 'Test Publication', quantity: 1, unitPrice: 300, itemTotal: 300 }],
    createdAt: new Date().toISOString()
  };

  const testModeResult = await sendBrevoStoreOrderEmail(testContext, { testMode: true });
  assert(testModeResult.success === true, 'Test mode returns success without contacting external API');
  assert(testModeResult.status === 'test_mocked', 'Status reflects test_mocked');
  assert(Boolean(testModeResult.messageId), 'Generates mock message ID');

  // Test 4: Deduplication / Idempotency Prevention
  console.log('\n4. Testing duplicate email prevention on event retry:');
  const duplicateRetryResult = await sendBrevoStoreOrderEmail(testContext, { testMode: true });
  assert(duplicateRetryResult.success === true, 'Duplicate retry returns success');
  assert(duplicateRetryResult.status === 'already_sent', 'Deduplication caught retry: status is "already_sent"');
  assert(duplicateRetryResult.note.includes('Duplicate send prevented'), 'Duplicate warning note recorded');

  // Test 5: Fallback when Brevo API Key is unconfigured
  console.log('\n5. Testing graceful degradation when BREVO_API_KEY is not set:');
  clearDispatchedEmailCacheForTests();
  const originalKey = process.env.BREVO_API_KEY;
  const originalSibKey = process.env.SENDINBLUE_API_KEY;
  delete process.env.BREVO_API_KEY;
  delete process.env.SENDINBLUE_API_KEY;

  const unconfiguredContext: OrderEmailContext = {
    orderId: 'test-ord-unconf-01',
    orderNumber: 'FET-ORD-TEST-UNCONF',
    eventType: 'order_shipped',
    customerName: 'Test Patron Unconfigured',
    customerEmail: 'test.unconf@example.com',
    total: 500,
    itemCount: 1,
    items: [{ productName: 'Book Item', quantity: 1, unitPrice: 500, itemTotal: 500 }],
    createdAt: new Date().toISOString()
  };

  const unconfResult = await sendBrevoStoreOrderEmail(unconfiguredContext, { testMode: false });
  assert(unconfResult.status === 'not_configured', 'Returns "not_configured" when API key is missing');
  assert(unconfResult.note.includes('not configured'), 'Returns informative degradation note');

  // Restore env keys
  if (originalKey) process.env.BREVO_API_KEY = originalKey;
  if (originalSibKey) process.env.SENDINBLUE_API_KEY = originalSibKey;

  // Test 6: Invalid Email Address Validation
  console.log('\n6. Testing invalid customer email rejection:');
  const invalidEmailContext: OrderEmailContext = {
    ...unconfiguredContext,
    orderId: 'test-ord-invalid-email',
    customerEmail: 'not-a-valid-email'
  };
  const invalidEmailResult = await sendBrevoStoreOrderEmail(invalidEmailContext, { testMode: true });
  assert(invalidEmailResult.status === 'failed', 'Rejects malformed recipient email');
  assert(invalidEmailResult.note.includes('Invalid customer email'), 'Logs email format rejection');

  // Test 7: Multi-alias detection without revealing secret values
  console.log('\n7. Testing environment variable alias detection:');
  const tempBrevo = process.env.BREVO_API_KEY;
  delete process.env.BREVO_API_KEY;
  process.env.SENDINBLUE_API_KEY = 'mock-key-for-test-alias';
  const aliasStatus = (await import('../src/services/storeEmailNotificationService')).getBrevoEnvironmentStatus();
  assert(aliasStatus.isConfigured === true, 'Detects alternate alias SENDINBLUE_API_KEY');
  assert(aliasStatus.detectedKeyVar === 'SENDINBLUE_API_KEY', 'Identifies exact detected variable name');
  delete process.env.SENDINBLUE_API_KEY;
  if (tempBrevo) process.env.BREVO_API_KEY = tempBrevo;

  // Test 8: Store Sender details verification
  console.log('\n8. Testing Store sender details:');
  const defaultStatus = (await import('../src/services/storeEmailNotificationService')).getBrevoEnvironmentStatus();
  assert(defaultStatus.senderEmail === 'noreply@fetindia.com', 'Default sender email matches verified sender noreply@fetindia.com');
  assert(defaultStatus.senderName === 'FATIMYAH EDUCATIONAL TRUST — FET Store', 'Default sender name matches FATIMYAH EDUCATIONAL TRUST — FET Store');

  console.log(`\n--- ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! ---\n`);
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
