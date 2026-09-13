/**
 * Razorpay Payment Gateway Integration for FET India
 * Supports Web, Mobile Web, PWA, and Capacitor Android WebView
 * Complies with RBI standards, Razorpay 2026 UPI Intent flow, and 80G tax receipt issuance.
 */

export interface RazorpayPublicConfig {
  keyId: string;
  isConfigured: boolean;
  mode: 'test' | 'live';
  currency: string;
  merchantName: string;
  supportEmail: string;
  supportPhone: string;
  trust80GNumber: string;
  description: string;
}

export interface CreateOrderParams {
  amount: number;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  donorPan?: string;
  campaignId?: string;
  campaignTitle?: string;
  donorUid?: string;
  isAnonymous?: boolean;
  message?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  internalReference: string;
  keyId: string;
  mode: 'test' | 'live';
  isConfigured: boolean;
  docId?: string;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  message: string;
  receiptNumber?: string;
  internalReference?: string;
  paymentId?: string;
  amount?: number;
  error?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Get backend API base URL.
 * Uses the configured production API base URL: import.meta.env.VITE_API_BASE_URL.
 * If empty or in local development, defaults to empty string for same-origin dev server proxy.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return '';
}

/**
 * Fetch client-safe Razorpay configuration from backend
 */
export async function fetchRazorpayConfig(): Promise<RazorpayPublicConfig> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/razorpay/config`);
    if (!res.ok) {
      throw new Error(`Failed to load Razorpay configuration (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Falling back to default Razorpay config:', err);
    return {
      keyId: 'rzp_test_FET_INDIA_TESTMODE',
      isConfigured: false,
      mode: 'test',
      currency: 'INR',
      merchantName: 'Fatimyah Educational Trust',
      supportEmail: 'fetkofficial@gmail.com',
      supportPhone: '+91 98923 00000',
      trust80GNumber: 'AAATF2843PF20214',
      description: '80G Certified Educational and Welfare Contributions'
    };
  }
}

/**
 * Ensure Razorpay checkout.js script is loaded and initialized
 */
export function loadRazorpaySDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if already injected in DOM
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Securely create a Razorpay Order on the backend
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/razorpay/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to initialize payment order with gateway.');
  }

  return data;
}

/**
 * Securely verify payment on the backend using HMAC SHA256 signature
 */
export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  internalReference: string;
  campaignId: string;
}): Promise<PaymentVerificationResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/razorpay/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Payment signature verification failed.');
  }

  return data;
}

/**
 * Launch the Razorpay Checkout Flow
 */
export async function initiateRazorpayContribution(options: {
  orderParams: CreateOrderParams;
  preferredMethod?: 'upi' | 'qr' | 'all';
  onOrderCreated?: (order: CreateOrderResult) => void;
  onSuccess: (result: PaymentVerificationResult) => void;
  onError: (errorMessage: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const {
    orderParams,
    preferredMethod = 'all',
    onOrderCreated,
    onSuccess,
    onError,
    onDismiss
  } = options;

  try {
    // 1. Ensure Razorpay SDK is loaded
    const isLoaded = await loadRazorpaySDK();
    if (!isLoaded && typeof window.Razorpay === 'undefined') {
      onError('Unable to load secure Razorpay Checkout SDK. Please check your internet connection and try again.');
      return;
    }

    // 2. Fetch gateway configuration
    const config = await fetchRazorpayConfig();

    // 3. Create server-side order
    const order = await createRazorpayOrder(orderParams);
    if (onOrderCreated) {
      onOrderCreated(order);
    }

    // 4. Configure Razorpay Standard Checkout
    const checkoutOptions: any = {
      key: order.keyId || config.keyId,
      amount: order.amount,
      currency: order.currency,
      name: config.merchantName,
      description: `80G Donation - ${orderParams.campaignTitle || 'Educational Trust'}`,
      image: '/favicon.svg',
      order_id: order.orderId,
      prefill: {
        name: orderParams.donorName,
        email: orderParams.donorEmail,
        contact: orderParams.donorPhone || ''
      },
      notes: {
        internalReference: order.internalReference,
        campaignId: orderParams.campaignId || 'direct-80g-trust-allocation',
        donorPan: orderParams.donorPan || 'NOT_PROVIDED'
      },
      theme: {
        color: '#064E3B' // FET India Deep Emerald Green
      },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          // Record cancellation non-blockingly
          fetch(`${getApiBaseUrl()}/api/razorpay/record-failure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              internalReference: order.internalReference,
              razorpayOrderId: order.orderId,
              errorDescription: 'Payment modal dismissed by contributor before authorization'
            })
          }).catch(() => {});
          if (onDismiss) {
            onDismiss();
          }
        }
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          // Verify on backend
          const verifyResult = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            internalReference: order.internalReference,
            campaignId: orderParams.campaignId || 'direct-80g-trust-allocation'
          });

          onSuccess(verifyResult);
        } catch (verificationErr: any) {
          console.error('Payment verification error:', verificationErr);
          onError(verificationErr.message || 'Payment completed but server signature verification failed. Please contact the Trust desk.');
        }
      }
    };

    // Method preference configuration
    if (preferredMethod === 'upi') {
      checkoutOptions.config = {
        display: {
          blocks: {
            upi_block: {
              name: 'Pay via UPI',
              instruments: [{ method: 'upi' }]
            }
          },
          sequence: ['block.upi_block'],
          preferences: {
            show_default_blocks: true
          }
        }
      };
    } else if (preferredMethod === 'qr') {
      checkoutOptions.config = {
        display: {
          blocks: {
            qr_block: {
              name: 'Scan & Pay via UPI QR',
              instruments: [{ method: 'upi', flows: ['qr'] }]
            }
          },
          sequence: ['block.qr_block'],
          preferences: {
            show_default_blocks: true
          }
        }
      };
    }

    // 5. If SDK is available, open Razorpay Checkout
    if (typeof window.Razorpay !== 'undefined') {
      const rzpInstance = new window.Razorpay(checkoutOptions);
      rzpInstance.on('payment.failed', (resp: any) => {
        const errorDesc = resp.error?.description || resp.error?.reason || 'Transaction could not be completed at gateway.';
        // Report failure to backend non-blockingly
        fetch(`${getApiBaseUrl()}/api/razorpay/record-failure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            internalReference: order.internalReference,
            razorpayOrderId: order.orderId,
            errorDescription: errorDesc
          })
        }).catch(() => {});
        onError(`Payment failed: ${errorDesc} (Code: ${resp.error?.code || 'UNKNOWN'})`);
      });
      rzpInstance.open();
    } else {
      // Fallback if script blocked: Inform user
      onError('Razorpay checkout module was blocked by browser extension or ad-blocker. Please disable shields and retry.');
    }
  } catch (err: any) {
    console.error('Razorpay contribution flow error:', err);
    onError(err.message || 'An unexpected error occurred while initiating your contribution.');
  }
}
