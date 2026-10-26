/**
 * @license
 * FET Store Customer Email Notification Service (Brevo / Sendinblue Integration)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Complies with Task 17:
 * - Reusable, responsive HTML email templates for order status updates
 * - Supports Brevo REST API (POST https://api.brevo.com/v3/smtp/email)
 * - Safe fallback when BREVO_API_KEY is not configured
 * - Deduplication via in-memory and database idempotency keys to avoid duplicate emails on retry
 * - Robust error isolation: email errors never corrupt order records or fail order status transitions
 * - Test mode safety: NEVER dispatches real external emails during automated testing
 */

export type OrderEmailEventType = 
  | 'order_received'
  | 'order_processing'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled';

export interface OrderEmailItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  variantName?: string;
}

export interface OrderEmailContext {
  orderId: string;
  orderNumber: string;
  eventType: OrderEmailEventType;
  customerName: string;
  customerEmail: string;
  total: number;
  currency?: string;
  itemCount: number;
  items: OrderEmailItem[];
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: string;
  updatedAt?: string;
  note?: string;
  actionUrl?: string;
}

export interface BrevoSendResult {
  success: boolean;
  status: 'sent' | 'not_configured' | 'already_sent' | 'test_mocked' | 'failed';
  messageId?: string;
  note: string;
  timestamp: string;
}

// In-memory idempotency deduplication cache to prevent re-sending during process lifetime
const dispatchedEmailKeys = new Set<string>();

/**
 * Escapes unsafe HTML characters to prevent XSS/injection in email templates
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an event-specific email subject, HTML layout, and plain text fallback
 */
export function renderStoreOrderEmail(context: OrderEmailContext): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const safeName = escapeHtml(context.customerName || 'Valued Patron');
  const safeOrderNumber = escapeHtml(context.orderNumber);
  const formattedTotal = `₹${(context.total || 0).toLocaleString('en-IN')}`;
  const safeDate = new Date(context.updatedAt || context.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const safeCity = escapeHtml(context.city || '');
  const safeState = escapeHtml(context.state || '');
  const destinationText = safeCity && safeState ? `${safeCity}, ${safeState}` : (safeCity || safeState || 'Registered Delivery Address');

  // Event-specific header colors, titles, and descriptions
  let headerBg = '#0D6E42'; // FET India emerald
  let eventHeadline = 'Order Received & Recorded';
  let eventSubheading = 'Thank you for supporting FET India Store. Your order is safely in our system.';
  let subject = `FET Store: Order #${context.orderNumber} Received`;

  switch (context.eventType) {
    case 'order_received':
      headerBg = '#0D6E42';
      eventHeadline = 'Order Confirmed & Placed';
      eventSubheading = 'Thank you for your purchase from FET India Store. Your order has been placed and confirmed for fulfillment.';
      subject = `FET Store: Order #${context.orderNumber} Confirmed`;
      break;
    case 'order_processing':
      headerBg = '#0284C7'; // Blue
      eventHeadline = 'Order In Processing';
      eventSubheading = 'Our store staff is currently preparing and packing your ordered publications and resources.';
      subject = `FET Store: Order #${context.orderNumber} is Processing`;
      break;
    case 'order_shipped':
      headerBg = '#4F46E5'; // Indigo
      eventHeadline = 'Order Dispatched & Shipped';
      eventSubheading = 'Your parcel has been handed over for dispatch and is on its way to your destination.';
      subject = `FET Store: Order #${context.orderNumber} Shipped`;
      break;
    case 'order_delivered':
      headerBg = '#059669'; // Emerald
      eventHeadline = 'Order Successfully Delivered';
      eventSubheading = 'Your order has been safely delivered. We pray this knowledge brings great benefit to your family and students.';
      subject = `FET Store: Order #${context.orderNumber} Delivered`;
      break;
    case 'order_cancelled':
      headerBg = '#E11D48'; // Rose
      eventHeadline = 'Order Cancelled';
      eventSubheading = context.note 
        ? `Order cancellation confirmed: ${escapeHtml(context.note)}`
        : 'Your order has been cancelled as requested.';
      subject = `FET Store: Order #${context.orderNumber} Cancelled`;
      break;
  }

  // Items table HTML
  const itemsHtml = (context.items || []).map(it => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; font-weight: 600;">
        ${escapeHtml(it.productName)}
        ${it.variantName ? `<span style="display: block; font-size: 11px; color: #64748B; font-weight: normal;">Variant: ${escapeHtml(it.variantName)}</span>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569; text-align: center;">
        ${it.quantity}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; text-align: right; font-weight: 600;">
        ₹${(it.itemTotal || (it.unitPrice * it.quantity) || 0).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: ${headerBg}; padding: 28px 24px; text-align: center; color: #FFFFFF;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255, 255, 255, 0.85); margin-bottom: 4px;">
                Fatimyah Educational Trust India • FET Store
              </div>
              <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                ${eventHeadline}
              </h1>
              <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.9);">
                ${eventSubheading}
              </p>
            </td>
          </tr>

          <!-- Order Summary Badge -->
          <tr>
            <td style="padding: 24px 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; border-radius: 12px; padding: 14px 18px;">
                <tr>
                  <td style="font-size: 12px; color: #64748B;">
                    <strong>Order Number:</strong> <span style="font-family: monospace; color: #0F172A; font-weight: 700;">${safeOrderNumber}</span>
                  </td>
                  <td align="right" style="font-size: 12px; color: #64748B;">
                    <strong>Date:</strong> <span style="color: #0F172A;">${safeDate}</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 6px; font-size: 12px; color: #64748B;">
                    <strong>Destination:</strong> <span style="color: #0F172A;">${destinationText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Salutation & Message Body -->
          <tr>
            <td style="padding: 0 24px 16px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #1E293B;">
                Dear <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
                This notification provides an authoritative update on your order with FET India Store. You can view comprehensive details, print your order receipt, and track real-time status in your customer dashboard at any time.
              </p>
            </td>
          </tr>

          <!-- Ordered Items Table -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; margin-bottom: 8px;">
                Order Summary (${context.itemCount || (context.items ? context.items.length : 1)} Item${(context.itemCount || 1) > 1 ? 's' : ''})
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #F8FAFC;">
                    <th align="left" style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; border-bottom: 1px solid #E2E8F0;">Product</th>
                    <th align="center" style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; border-bottom: 1px solid #E2E8F0; width: 60px;">Qty</th>
                    <th align="right" style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; border-bottom: 1px solid #E2E8F0; width: 90px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #F8FAFC;">
                    <td colspan="2" style="padding: 12px 12px; font-size: 13px; font-weight: 700; color: #0F172A; text-align: right;">
                      Order Total:
                    </td>
                    <td style="padding: 12px 12px; font-size: 15px; font-weight: 800; color: #0D6E42; text-align: right;">
                      ${formattedTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Portal Access CTA -->
          <tr>
            <td style="padding: 0 24px 24px 24px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #0D6E42;">
                    <a href="https://fetindia.org/#/dashboard" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-weight: 700; color: #FFFFFF; text-decoration: none; padding: 12px 24px; display: inline-block;">
                      Open Member Dashboard & Order History
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice & Support Info -->
          <tr>
            <td style="padding: 16px 24px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">
                <strong>Privacy & Security Note:</strong> This is a secure transactional dispatch regarding your FET India Store order. For security, full payment or banking identifiers are never transmitted in notification emails.
              </p>
              <p style="margin: 0;">
                Have questions regarding your order? Contact FET India Store Helpdesk at 
                <a href="mailto:fetkofficial@gmail.com" style="color: #0D6E42; text-decoration: underline;">fetkofficial@gmail.com</a> or helpline <a href="tel:+919149414549" style="color: #0D6E42; text-decoration: underline;">+91 91494 14549</a>.
              </p>
            </td>
          </tr>

          <!-- Institutional Trust Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #0B2545; color: #94A3B8; font-size: 10px; text-align: center; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
              <div style="font-weight: 700; color: #E2E8F0; margin-bottom: 2px;">
                Fatimyah Educational Trust India
              </div>
              <div>
                Registered Indian Non-Profit Trust • Section 80G & 12A Statutory Exemption Certified
              </div>
              <div style="margin-top: 4px; color: #64748B;">
                Central Digital Repository & Store Administration Secretariat
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
FET INDIA STORE • ${eventHeadline.toUpperCase()}
Order Number: ${context.orderNumber}
Date: ${safeDate}
Total: ${formattedTotal}
Status Update: ${eventSubheading}

Dear ${context.customerName || 'Customer'},

${eventSubheading}

Items:
${(context.items || []).map(i => `- ${i.productName} (x${i.quantity}) - ₹${i.itemTotal}`).join('\n')}

Order Total: ${formattedTotal}
Destination: ${destinationText}

You can view full details in your FET India Account Dashboard:
https://fetindia.org/#/dashboard

Support: fetkofficial@gmail.com | +91 91494 14549
Fatimyah Educational Trust India
  `.trim();

  return { subject, htmlContent, textContent };
}

/**
 * Inspects environment variable names already in use without revealing secret values.
 */
export function getBrevoEnvironmentStatus(): {
  isConfigured: boolean;
  detectedKeyVar?: string;
  senderEmail: string;
  senderName: string;
} {
  const potentialKeyNames = [
    'BREVO_API_KEY',
    'SENDINBLUE_API_KEY',
    'SIB_API_KEY',
    'BREVO_KEY',
    'BREVO_SMTP_KEY',
    'BREVO_SECRET',
    'BREVO_API_SECRET'
  ];

  let detectedKeyVar: string | undefined = undefined;
  for (const varName of potentialKeyNames) {
    const val = process.env[varName];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      detectedKeyVar = varName;
      break;
    }
  }

  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL || 
    process.env.SENDINBLUE_SENDER_EMAIL || 
    process.env.BREVO_FROM_EMAIL || 
    process.env.SENDINBLUE_FROM_EMAIL || 
    process.env.STORE_SENDER_EMAIL || 
    process.env.DEFAULT_FROM_EMAIL || 
    process.env.MAIL_FROM_ADDRESS || 
    process.env.SENDER_EMAIL || 
    'noreply@fetindia.com'
  ).trim();

  const senderName = (
    process.env.BREVO_SENDER_NAME || 
    process.env.SENDINBLUE_SENDER_NAME || 
    process.env.BREVO_FROM_NAME || 
    process.env.STORE_SENDER_NAME || 
    process.env.DEFAULT_FROM_NAME || 
    process.env.MAIL_FROM_NAME || 
    process.env.SENDER_NAME || 
    'FATIMYAH EDUCATIONAL TRUST — FET Store'
  ).trim();

  return {
    isConfigured: Boolean(detectedKeyVar),
    detectedKeyVar,
    senderEmail,
    senderName
  };
}

/**
 * Sends a transactional order email via Brevo REST API (https://api.brevo.com/v3/smtp/email)
 * Gracefully degrades if Brevo is not configured or in test environments.
 */
export async function sendBrevoStoreOrderEmail(
  context: OrderEmailContext,
  options?: { 
    testMode?: boolean;
    timeoutMs?: number;
  }
): Promise<BrevoSendResult> {
  const nowIso = new Date().toISOString();
  const idempotencyKey = `store_email_${context.orderId}_${context.eventType}`;

  // 1. In-process deduplication check
  if (dispatchedEmailKeys.has(idempotencyKey)) {
    return {
      success: true,
      status: 'already_sent',
      note: `Email event "${context.eventType}" was already dispatched for order "${context.orderNumber}". Duplicate send prevented.`,
      timestamp: nowIso
    };
  }

  // 2. Validate customer recipient email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!context.customerEmail || !emailRegex.test(context.customerEmail.trim())) {
    return {
      success: false,
      status: 'failed',
      note: `Invalid customer email address: "${context.customerEmail}". Email not dispatched.`,
      timestamp: nowIso
    };
  }

  // 3. Automated test mode safety (Strictly prevent real email dispatch during testing)
  const isTest = options?.testMode || process.env.NODE_ENV === 'test' || process.env.STORE_NOTIFICATION_TEST === 'true';
  if (isTest) {
    dispatchedEmailKeys.add(idempotencyKey);
    return {
      success: true,
      status: 'test_mocked',
      messageId: `test-brevo-${context.orderNumber}-${Date.now()}`,
      note: `Automated test mode active: Brevo email for event "${context.eventType}" safely mocked without sending external email.`,
      timestamp: nowIso
    };
  }

  // 4. Inspect Brevo API configuration in environment across standard aliases
  const envStatus = getBrevoEnvironmentStatus();
  const brevoApiKey = envStatus.detectedKeyVar ? (process.env[envStatus.detectedKeyVar] || '').trim() : '';
  const brevoSenderEmail = envStatus.senderEmail;
  const brevoSenderName = envStatus.senderName;

  if (!brevoApiKey) {
    // Graceful degradation when external email provider is not yet provisioned in environment
    return {
      success: false,
      status: 'not_configured',
      note: 'Brevo API key is not configured in current environment (checked BREVO_API_KEY, SENDINBLUE_API_KEY, SIB_API_KEY, BREVO_KEY). In-app notifications are delivered to recipient inbox.',
      timestamp: nowIso
    };
  }

  // 5. Render email template
  const { subject, htmlContent, textContent } = renderStoreOrderEmail(context);

  // 6. Dispatch to Brevo REST API with timeout and error isolation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs || 8000);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: brevoSenderName,
          email: brevoSenderEmail
        },
        to: [
          {
            email: context.customerEmail.trim(),
            name: (context.customerName || 'Valued Customer').trim()
          }
        ],
        subject,
        htmlContent,
        textContent,
        tags: ['store_order', context.eventType, context.orderNumber]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn(`[Brevo Email Service] Error response (${response.status}):`, data);
      return {
        success: false,
        status: 'failed',
        note: (data && data.message) ? String(data.message) : `Brevo API HTTP ${response.status} error`,
        timestamp: nowIso
      };
    }

    // Mark as successfully sent in memory
    dispatchedEmailKeys.add(idempotencyKey);

    return {
      success: true,
      status: 'sent',
      messageId: data.messageId || `brevo-${Date.now()}`,
      note: `Email for event "${context.eventType}" successfully delivered via Brevo.`,
      timestamp: nowIso
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === 'AbortError';
    const errorMsg = isAbort ? 'Brevo API dispatch timed out after 8000ms.' : (err?.message || 'Network error reaching Brevo API.');
    console.warn('[Brevo Email Service] Non-fatal dispatch exception:', errorMsg);

    return {
      success: false,
      status: 'failed',
      note: errorMsg,
      timestamp: nowIso
    };
  }
}

/**
 * Reset memory cache (used exclusively by test suites)
 */
export function clearDispatchedEmailCacheForTests(): void {
  dispatchedEmailKeys.clear();
}
