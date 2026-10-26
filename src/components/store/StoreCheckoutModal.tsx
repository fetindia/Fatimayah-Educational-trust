/**
 * @license
 * Store Checkout Preparation & Order Foundation Modal (Store Task 14)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Secure checkout flow that:
 * - Collects customer details, billing, and delivery address
 * - Integrates with authenticated user profile
 * - Validates authoritative prices and stock limits with server API
 * - Creates authoritative Order Draft in store_orders collection
 * - Strictly decouples from payment gateways and shipping courier APIs
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Truck,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  Info,
  FileText,
  Check,
  Lock,
  Printer,
  Package,
  CreditCard,
  Banknote,
  Gift,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { INDIAN_STATES_AND_UTS } from '../../data/indiaLocations';
import { 
  StoreAddress, 
  StoreCustomerInfo, 
  StoreOrderItem, 
  StoreOrderValidationResponse 
} from '../../types';
import { 
  auth,
  createStoreOrderDraft,
  createStoreRazorpayOrder,
  verifyStoreRazorpayPayment,
  recordStorePaymentFailure
} from '../../lib/firebase';
import { loadRazorpaySDK } from '../../lib/razorpay';

interface StoreCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  onViewOrderHistory?: () => void;
}

export const StoreCheckoutModal: React.FC<StoreCheckoutModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onViewOrderHistory
}) => {
  const { currentUser, userProfile } = useAuth();
  const { cart, clearCart } = useCart();

  // Steps: 1 = Address & Customer, 2 = Authoritative Review, 3 = Confirmation Draft
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Customer
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [membershipId, setMembershipId] = useState('');

  // Form State - Billing Address
  const [billingAddressLine1, setBillingAddressLine1] = useState('');
  const [billingAddressLine2, setBillingAddressLine2] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('Jammu & Kashmir');
  const [billingPincode, setBillingPincode] = useState('');
  const [billingLandmark, setBillingLandmark] = useState('');

  // Form State - Shipping Address
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddressLine1, setShippingAddressLine1] = useState('');
  const [shippingAddressLine2, setShippingAddressLine2] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('Jammu & Kashmir');
  const [shippingPincode, setShippingPincode] = useState('');

  // Optional Institutional Order
  const [isInstitutionalOrder, setIsInstitutionalOrder] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [scholarshipRollNumber, setScholarshipRollNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Validation & Processing States
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<StoreOrderValidationResponse | null>(null);
  const [clientRequestId, setClientRequestId] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'razorpay' | 'free'>('COD');
  const [createdOrderResult, setCreatedOrderResult] = useState<{
    orderId: string;
    orderNumber: string;
    total: number;
    paymentMethod: 'COD' | 'razorpay' | string;
    paymentStatus: string;
    orderStatus: string;
    paymentId?: string;
  } | null>(null);

  // Reset modal state when closed after an order is completed
  useEffect(() => {
    if (!isOpen && createdOrderResult) {
      setCurrentStep(1);
      setCreatedOrderResult(null);
      setValidationResult(null);
      setClientRequestId('');
      setFormErrors([]);
      setSelectedPaymentMethod('COD');
    }
  }, [isOpen, createdOrderResult]);

  // Autofill from existing authenticated user
  useEffect(() => {
    if (currentUser) {
      if (!fullName) {
        setFullName(currentUser.displayName || userProfile?.displayName || '');
      }
      if (!email) {
        setEmail(currentUser.email || userProfile?.email || '');
      }
      if (!mobileNumber && userProfile?.phoneNumber) {
        setMobileNumber(userProfile.phoneNumber);
      }
      if (!membershipId && userProfile?.membershipId) {
        setMembershipId(userProfile.membershipId);
      }
    }
  }, [currentUser, userProfile, isOpen]);

  // Check if cart has only digital items
  const isAllDigitalCart = useMemo(() => {
    return cart.items.length > 0 && cart.items.every(i => i.productType === 'digital');
  }, [cart.items]);

  if (!isOpen) return null;

  // Validate Step 1 Fields
  const handleProceedToReview = async () => {
    const errs: string[] = [];

    if (!currentUser && typeof (auth as any).authStateReady === 'function') {
      try {
        await (auth as any).authStateReady();
      } catch {
        // continue
      }
    }

    const effectiveUser = auth.currentUser || currentUser;
    if (!effectiveUser) {
      errs.push('Please sign in to proceed with store checkout.');
      setFormErrors(errs);
      return;
    }

    if (!fullName.trim()) errs.push('Full name is required.');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.push('A valid email address is required.');
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    const normMobile = cleanMobile.length === 12 && cleanMobile.startsWith('91')
      ? cleanMobile.slice(2)
      : (cleanMobile.length === 11 && cleanMobile.startsWith('0') ? cleanMobile.slice(1) : cleanMobile);
    if (normMobile.length !== 10) {
      errs.push('A valid 10-digit mobile number is required.');
    }

    if (!billingAddressLine1.trim()) errs.push('Billing Address Line 1 is required.');
    if (!billingCity.trim()) errs.push('Billing City is required.');
    if (!billingState.trim()) errs.push('Billing State is required.');
    if (!billingPincode.trim() || billingPincode.replace(/\D/g, '').length !== 6) {
      errs.push('Valid 6-digit billing PIN code is required.');
    }

    if (!sameAsBilling && !isAllDigitalCart) {
      if (!shippingAddressLine1.trim()) errs.push('Shipping Address Line 1 is required.');
      if (!shippingCity.trim()) errs.push('Shipping City is required.');
      if (!shippingState.trim()) errs.push('Shipping State is required.');
      if (!shippingPincode.trim() || shippingPincode.replace(/\D/g, '').length !== 6) {
        errs.push('Valid 6-digit shipping PIN code is required.');
      }
    }

    if (isInstitutionalOrder && !institutionName.trim()) {
      errs.push('Institution / School / Madrasa name is required for institutional orders.');
    }

    if (cart.items.length === 0) {
      errs.push('Your cart is empty.');
    }

    for (const item of cart.items) {
      const q = Number(item.quantity);
      if (isNaN(q) || !Number.isInteger(q) || q <= 0) {
        errs.push(`Quantity for "${item.productName}" must be a valid positive whole number.`);
      }
      if (q > 500) {
        errs.push(`Quantity for "${item.productName}" exceeds the maximum allowable order limit (500 units).`);
      }
    }

    if (errs.length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors([]);
    setIsValidating(true);

    // Call server-side authoritative validation
    try {
      const billing: StoreAddress = {
        addressLine1: billingAddressLine1.trim(),
        addressLine2: billingAddressLine2.trim() || undefined,
        city: billingCity.trim(),
        state: billingState.trim(),
        pincode: billingPincode.trim(),
        country: 'India',
        landmark: billingLandmark.trim() || undefined
      };

      const shipping: StoreAddress = sameAsBilling || isAllDigitalCart
        ? billing
        : {
            addressLine1: shippingAddressLine1.trim(),
            addressLine2: shippingAddressLine2.trim() || undefined,
            city: shippingCity.trim(),
            state: shippingState.trim(),
            pincode: shippingPincode.trim(),
            country: 'India'
          };

      const customer: StoreCustomerInfo = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: normMobile,
        userUid: currentUser.uid,
        membershipId: membershipId.trim() || undefined,
        isRegisteredUser: true
      };

      let validateRes: Response;
      try {
        validateRes = await fetch('/api/store/orders/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.items.map(item => ({
              productId: item.productId,
              variantId: item.selectedVariant?.id,
              quantity: item.quantity
            })),
            customer,
            billingAddress: billing,
            shippingAddress: shipping,
            notes: deliveryNotes.trim() || undefined,
            deliveryNotes: deliveryNotes.trim() || undefined,
            educationalInstitutionalOrder: isInstitutionalOrder,
            institutionName: institutionName.trim() || undefined
          })
        });
      } catch (netErr: any) {
        setFormErrors(['Network communication error while contacting order validation server. Please check your connection.']);
        setIsValidating(false);
        return;
      }

      // Check Content-Type and HTTP status before attempting JSON parsing
      const contentType = validateRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const isHtml = contentType.includes('text/html');
        setFormErrors([
          isHtml
            ? `Server returned an unexpected HTML response (HTTP ${validateRes.status}) instead of JSON. The order service may be temporarily unavailable or restarting.`
            : `Server returned an invalid response format (HTTP ${validateRes.status}, ${contentType || 'non-JSON'}).`
        ]);
        setIsValidating(false);
        return;
      }

      let data: any;
      try {
        data = await validateRes.json();
      } catch (parseErr: any) {
        setFormErrors([`Failed to parse server validation response (HTTP ${validateRes.status}). Expected valid JSON.`]);
        setIsValidating(false);
        return;
      }

      if (!validateRes.ok || !data.isValid) {
        setFormErrors(Array.isArray(data.errors) && data.errors.length > 0 ? data.errors : [data.error || 'Server validation failed.']);
        setIsValidating(false);
        return;
      }

      const reqId = clientRequestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      setClientRequestId(reqId);
      setValidationResult(data);

      // Default payment method based on cart product capabilities
      const allowed = data.allowedPaymentMethods || ['COD', 'razorpay'];
      if (data.isFreeOrder || data.total === 0 || allowed.includes('free')) {
        setSelectedPaymentMethod('free');
      } else if (!allowed.includes('COD') && allowed.includes('razorpay')) {
        setSelectedPaymentMethod('razorpay');
      } else {
        setSelectedPaymentMethod('COD');
      }

      setCurrentStep(2);
    } catch (err: any) {
      setFormErrors([err.message || 'An unexpected error occurred while validating the order.']);
    } finally {
      setIsValidating(false);
    }
  };

  // Step 2: Place Order (Cash on Delivery or Razorpay Online Payment)
  const handlePlaceOrder = async () => {
    if (isSubmitting || !validationResult) return;

    if (!currentUser && typeof (auth as any).authStateReady === 'function') {
      try {
        await (auth as any).authStateReady();
      } catch {
        // continue
      }
    }

    const effectiveUser = auth.currentUser || currentUser;
    if (!effectiveUser) {
      setFormErrors(['Authentication Required: Please sign in with your FET India member account to complete your purchase.']);
      return;
    }

    if (validationResult.hasPaymentMethodConflict) {
      setFormErrors([validationResult.paymentMethodConflictReason || 'Cart contains conflicting items. Please remove incompatible items to proceed.']);
      return;
    }

    setIsSubmitting(true);
    setFormErrors([]);

    try {
      const billing: StoreAddress = {
        addressLine1: billingAddressLine1.trim(),
        addressLine2: billingAddressLine2.trim() || undefined,
        city: billingCity.trim(),
        state: billingState.trim(),
        pincode: billingPincode.trim(),
        country: 'India',
        landmark: billingLandmark.trim() || undefined
      };

      const cleanMobile = mobileNumber.replace(/\D/g, '');
      const normMobile = cleanMobile.length === 12 && cleanMobile.startsWith('91')
        ? cleanMobile.slice(2)
        : (cleanMobile.length === 11 && cleanMobile.startsWith('0') ? cleanMobile.slice(1) : cleanMobile);

      const shipping: StoreAddress = sameAsBilling || isAllDigitalCart
        ? billing
        : {
            addressLine1: shippingAddressLine1.trim(),
            addressLine2: shippingAddressLine2.trim() || undefined,
            city: shippingCity.trim(),
            state: shippingState.trim(),
            pincode: shippingPincode.trim(),
            country: 'India'
          };

      const customer: StoreCustomerInfo = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: normMobile,
        userUid: currentUser.uid,
        membershipId: membershipId.trim() || undefined,
        isRegisteredUser: true
      };

      const orderPayload = {
        userId: currentUser.uid,
        clientRequestId: clientRequestId || undefined,
        customer,
        billingAddress: billing,
        shippingAddress: shipping,
        items: validationResult.validatedItems,
        notes: deliveryNotes.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        educationalInstitutionalOrder: isInstitutionalOrder,
        institutionName: institutionName.trim() || undefined,
        scholarshipRollNumber: scholarshipRollNumber.trim() || undefined
      };

      if (selectedPaymentMethod === 'free' || validationResult.total === 0) {
        // Direct Free / Complimentary Order Placement (₹0 - No Payment Gateway required)
        const result = await createStoreOrderDraft({
          ...orderPayload,
          paymentMethod: 'free'
        });

        const isAllDigital = validationResult.validatedItems.every(it => it.isDigital || it.productType === 'digital' || it.productType === 'publication');

        setCreatedOrderResult({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          total: 0,
          paymentMethod: 'free',
          paymentStatus: 'free',
          orderStatus: isAllDigital ? 'completed' : 'processing'
        });

        clearCart();
        setCurrentStep(3);
      } else if (selectedPaymentMethod === 'COD') {
        // Place real Cash on Delivery order
        const result = await createStoreOrderDraft({
          ...orderPayload,
          paymentMethod: 'COD'
        });

        setCreatedOrderResult({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          total: result.total,
          paymentMethod: 'COD',
          paymentStatus: 'unpaid',
          orderStatus: 'processing'
        });

        clearCart();
        setCurrentStep(3);
      } else {
        // Razorpay Online Payment Flow
        // 1. Create order record on backend in pending_payment status
        const draftResult = await createStoreOrderDraft({
          ...orderPayload,
          paymentMethod: 'razorpay'
        });

        // If draft resulted in zero amount, complete immediately without gateway
        if (draftResult.total === 0) {
          const isAllDigital = validationResult.validatedItems.every(it => it.isDigital || it.productType === 'digital' || it.productType === 'publication');
          setCreatedOrderResult({
            orderId: draftResult.orderId,
            orderNumber: draftResult.orderNumber,
            total: 0,
            paymentMethod: 'free',
            paymentStatus: 'free',
            orderStatus: isAllDigital ? 'completed' : 'processing'
          });
          clearCart();
          setCurrentStep(3);
          return;
        }

        const isDemoCart = cart.items.some(it => it.isDemo || it.productId.startsWith('demo-'));

        // 2. Initialize Razorpay gateway order on backend
        const rzpData = await createStoreRazorpayOrder({
          orderId: draftResult.orderId,
          testMode: isDemoCart || undefined
        });

        if (rzpData.isFree || rzpData.amount === 0) {
          setCreatedOrderResult({
            orderId: draftResult.orderId,
            orderNumber: draftResult.orderNumber,
            total: 0,
            paymentMethod: 'free',
            paymentStatus: 'free',
            orderStatus: rzpData.orderStatus || 'completed'
          });
          clearCart();
          setCurrentStep(3);
          return;
        }

        // 3. Load Razorpay Checkout SDK
        const sdkLoaded = await loadRazorpaySDK();
        if (!sdkLoaded && typeof (window as any).Razorpay === 'undefined') {
          throw new Error('Unable to load secure Razorpay checkout module. Please check your internet connection.');
        }

        // 4. Open Razorpay Checkout modal
        const checkoutOptions: any = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency || 'INR',
          name: 'FATIMYAH EDUCATIONAL TRUST',
          description: `FET Store Order #${draftResult.orderNumber}`,
          image: '/favicon.svg',
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            contact: normMobile
          },
          theme: {
            color: '#064E3B'
          },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              recordStorePaymentFailure({
                orderId: draftResult.orderId,
                razorpayOrderId: rzpData.razorpayOrderId,
                errorDescription: 'Payment window was closed by the user.'
              });
              setFormErrors([
                `Payment was not completed. Order #${draftResult.orderNumber} is saved with Pending Payment status. You can retry payment anytime.`
              ]);
              setIsSubmitting(false);
            }
          },
          handler: async (resp: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 5. Verify payment cryptographically on backend
              await verifyStoreRazorpayPayment({
                orderId: draftResult.orderId,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature
              });

              setCreatedOrderResult({
                orderId: draftResult.orderId,
                orderNumber: draftResult.orderNumber,
                total: draftResult.total,
                paymentMethod: 'razorpay',
                paymentStatus: 'captured',
                orderStatus: 'paid',
                paymentId: resp.razorpay_payment_id
              });

              clearCart();
              setCurrentStep(3);
            } catch (vErr: any) {
              console.error('Payment verification failed:', vErr);
              setFormErrors([vErr.message || 'Payment received but verification failed. Please contact store support.']);
            } finally {
              setIsSubmitting(false);
            }
          }
        };

        if (typeof (window as any).Razorpay !== 'undefined') {
          const rzpInstance = new (window as any).Razorpay(checkoutOptions);
          rzpInstance.on('payment.failed', (failResp: any) => {
            const desc = failResp.error?.description || 'Transaction failed at gateway.';
            recordStorePaymentFailure({
              orderId: draftResult.orderId,
              razorpayOrderId: rzpData.razorpayOrderId,
              errorDescription: desc
            });
            setFormErrors([`Payment failed: ${desc}`]);
            setIsSubmitting(false);
          });
          rzpInstance.open();
        } else {
          throw new Error('Razorpay checkout could not be initialized in this browser session.');
        }
      }
    } catch (err: any) {
      console.error('[Store Order] Order error:', err);
      const errMsg = err?.message || '';
      const errCode = err?.code || '';
      const isGatewayAuthErr = errCode === 'GATEWAY_AUTH_CONFIG_ERROR' || errCode === 'GATEWAY_ERROR' || errMsg.toLowerCase().includes('gateway') || errMsg.toLowerCase().includes('merchant') || errMsg.toLowerCase().includes('razorpay');
      const isValidationErr = errCode === 'INVALID_REQUEST' || errCode === 'validation_error' || errMsg.toLowerCase().includes('validation') || errMsg.toLowerCase().includes('required') || errMsg.toLowerCase().includes('must contain');
      const isNotFoundErr = errCode === 'ORDER_NOT_FOUND' || errCode === 'not_found' || errMsg.toLowerCase().includes('not found');
      const isTokenExpired = errCode === 'AUTH_TOKEN_EXPIRED' || errMsg.toLowerCase().includes('token has expired') || errMsg.toLowerCase().includes('session has expired');
      const isAuthErr = !isGatewayAuthErr && (isTokenExpired || errCode === 'UNAUTHENTICATED' || errCode === 'INVALID_AUTH_TOKEN' || errMsg.toLowerCase().includes('signed in') || errMsg.toLowerCase().includes('auth token') || errMsg.toLowerCase().includes('log in') || errMsg.toLowerCase().includes('sign in'));
      const isPermissionErr = errCode === 'permission-denied' || errCode === 'PERMISSION_DENIED' || errMsg.toLowerCase().includes('permission denied') || errMsg.toLowerCase().includes('access denied');

      if (isTokenExpired) {
        setFormErrors(['Authentication Failed: Your session or authentication token has expired. Please sign in again.']);
      } else if (isAuthErr) {
        setFormErrors([errMsg || 'Authentication Required: Please sign in with your FET India member account to complete your purchase.']);
      } else if (isGatewayAuthErr) {
        setFormErrors([errMsg || 'Payment Gateway Notice: Razorpay online checkout could not be initialized. Please choose Cash on Delivery or contact store support.']);
      } else if (isPermissionErr) {
        setFormErrors([errMsg || 'Permission Denied: You do not have permission to place or modify this order.']);
      } else if (isValidationErr) {
        setFormErrors([errMsg || 'Order validation failed. Please check your submitted cart and details.']);
      } else if (isNotFoundErr) {
        setFormErrors([errMsg || 'The requested order could not be found.']);
      } else {
        setFormErrors([errMsg || 'Failed to place order. Please try again.']);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200 font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                FET Store Checkout Preparation
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative Order Intent & Address Collection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className={`flex items-center gap-1.5 ${currentStep === 1 ? 'text-emerald-700 font-black' : currentStep > 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
              1
            </span>
            <span>Customer & Address</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${currentStep === 2 ? 'text-emerald-700 font-black' : currentStep > 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
              2
            </span>
            <span>Authoritative Review</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${currentStep === 3 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
              3
            </span>
            <span>Order Draft Registered</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">

          {/* Authentication Barrier */}
          {!currentUser && currentStep !== 3 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">FET Account Authentication Required</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    To maintain authoritative records, tax invoices, and institutional tracking, please sign in with your FET India account.
                  </p>
                </div>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer text-center"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          )}

          {/* Error Banner */}
          {formErrors.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  {currentStep === 1 
                    ? 'Please resolve the following requirements:' 
                    : 'Order & Payment Notice:'}
                </span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                {formErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 1: CUSTOMER & ADDRESS DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Customer Contact Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Customer Contact Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Syed Mohammad"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. user@example.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      maxLength={12}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      FET Membership ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={membershipId}
                      onChange={(e) => setMembershipId(e.target.value)}
                      placeholder="e.g. FET-MEM-2026-0042"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Billing Address (Authoritative Tax & Invoice)</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Address Line 1 (House/Flat No, Street, Mohalla) *
                    </label>
                    <input
                      type="text"
                      value={billingAddressLine1}
                      onChange={(e) => setBillingAddressLine1(e.target.value)}
                      placeholder="e.g. House 14, Main Road, Lal Bazar"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Address Line 2 / Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={billingAddressLine2}
                        onChange={(e) => setBillingAddressLine2(e.target.value)}
                        placeholder="e.g. Near Central Imambargah"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="e.g. Srinagar"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        State / UT *
                      </label>
                      <select
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                      >
                        {INDIAN_STATES_AND_UTS.map((st) => (
                          <option key={st.state} value={st.state}>
                            {st.state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        PIN Code (6 digits) *
                      </label>
                      <input
                        type="text"
                        value={billingPincode}
                        onChange={(e) => setBillingPincode(e.target.value)}
                        placeholder="e.g. 190011"
                        maxLength={6}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value="India"
                        disabled
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address Section */}
              {isAllDigitalCart ? (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-2.5 text-xs text-purple-900">
                  <Mail className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>
                    <strong>Digital Delivery Mode:</strong> All items in this order are digital assets. Download access compendiums will be dispatched directly to your registered email address ({email || 'account'}).
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Physical Delivery Destination</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                      />
                      <span>Same as billing address</span>
                    </label>
                  </div>

                  {!sameAsBilling && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Delivery Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={shippingAddressLine1}
                          onChange={(e) => setShippingAddressLine1(e.target.value)}
                          placeholder="e.g. Campus Building A, Gate 2"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            City / Town *
                          </label>
                          <input
                            type="text"
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            placeholder="e.g. Srinagar"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            State / UT *
                          </label>
                          <select
                            value={shippingState}
                            onChange={(e) => setShippingState(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                          >
                            {INDIAN_STATES_AND_UTS.map((st) => (
                              <option key={st.state} value={st.state}>
                                {st.state}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            PIN Code *
                          </label>
                          <input
                            type="text"
                            value={shippingPincode}
                            onChange={(e) => setShippingPincode(e.target.value)}
                            placeholder="e.g. 190011"
                            maxLength={6}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Institutional / School Order */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstitutionalOrder}
                    onChange={(e) => setIsInstitutionalOrder(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Educational / School / Madrasa Institutional Order</span>
                  </div>
                </label>

                {isInstitutionalOrder && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Institution / Madrasa Name *
                      </label>
                      <input
                        type="text"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g. Imamia Higher Secondary Institute"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Student / Roll Number (If Applicable)
                      </label>
                      <input
                        type="text"
                        value={scholarshipRollNumber}
                        onChange={(e) => setScholarshipRollNumber(e.target.value)}
                        placeholder="e.g. FET-STU-8821"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Special Delivery Instructions / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Preferred timing, call before arrival, deliver to school office"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AUTHORITATIVE ORDER REVIEW */}
          {currentStep === 2 && validationResult && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Authoritative catalog and inventory verification completed successfully.
                </span>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Ordered Catalog Items ({validationResult.validatedItems.length})</span>
                  <span>Authoritative Total</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {validationResult.validatedItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div className="space-y-0.5 max-w-[70%]">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-[11px] text-indigo-700 font-medium">
                            Variant: {item.variantName}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500">
                          Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                          {item.sku && <span className="ml-2 font-mono text-[10px]">({item.sku})</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          ₹{item.itemTotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Authoritative Subtotal</span>
                  <span className="font-medium text-slate-900">
                    ₹{validationResult.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard Shipping & Handling</span>
                  <span className="font-medium text-emerald-700">
                    ₹0 (Complimentary / Phase 2 Calculated)
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (GST/Statutory)</span>
                  <span className="font-medium text-slate-700">₹0 (All taxes inclusive)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-emerald-800 font-black">
                    ₹{validationResult.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Customer & Address Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recipient</span>
                  </div>
                  <p className="font-medium text-slate-900">{fullName}</p>
                  <p className="text-slate-500 text-[11px]">{email} • {mobileNumber}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fulfillment Address</span>
                  </div>
                  <p className="text-slate-700 text-[11px]">
                    {sameAsBilling || isAllDigitalCart ? billingAddressLine1 : shippingAddressLine1}, {sameAsBilling || isAllDigitalCart ? billingCity : shippingCity}, {sameAsBilling || isAllDigitalCart ? billingState : shippingState} - {sameAsBilling || isAllDigitalCart ? billingPincode : shippingPincode}
                  </p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Select Payment Method *</span>
                  </div>
                  {validationResult.total === 0 || validationResult.isFreeOrder ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Complimentary / Zero Cost
                    </span>
                  ) : validationResult.allowedPaymentMethods && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      {validationResult.allowedPaymentMethods.length === 2 
                        ? 'COD and Online Payment Supported' 
                        : validationResult.allowedPaymentMethods.includes('COD') 
                        ? 'COD Available' 
                        : 'Online Payment Only'}
                    </span>
                  )}
                </div>

                {validationResult.total === 0 || validationResult.isFreeOrder ? (
                  <div
                    onClick={() => setSelectedPaymentMethod('free')}
                    className="p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative bg-emerald-50/70 border-emerald-600 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-600 text-white">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <div>Complimentary / Open Access Order</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">Zero Payment Required (₹0)</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={selectedPaymentMethod === 'free' || validationResult.total === 0}
                        readOnly
                        className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                    <div className="mt-2.5 text-[11px] text-slate-600 leading-relaxed">
                      This order contains complimentary open-access educational materials or publications. You can confirm your order immediately without any payment gateway or billing transaction.
                    </div>
                  </div>
                ) : validationResult.hasPaymentMethodConflict ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Cart Payment Conflict</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      {validationResult.paymentMethodConflictReason || 'Some items in your cart only support Cash on Delivery while others require Online Payment. Please place separate orders.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Option A: Cash on Delivery */}
                    {(() => {
                      const isCodAvailable = !validationResult.allowedPaymentMethods || validationResult.allowedPaymentMethods.includes('COD');
                      const isSelected = selectedPaymentMethod === 'COD';
                      return (
                        <div
                          onClick={() => {
                            if (isCodAvailable) setSelectedPaymentMethod('COD');
                          }}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                            !isCodAvailable 
                              ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-50/70 border-emerald-600 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <div>Cash on Delivery</div>
                                <div className="text-[10px] text-slate-500 font-normal">Pay in cash upon arrival</div>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={isSelected}
                              disabled={!isCodAvailable}
                              onChange={() => setSelectedPaymentMethod('COD')}
                              className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </div>
                          <div className="mt-2.5 text-[11px] text-slate-600">
                            {isCodAvailable 
                              ? 'Pay exact cash of ₹' + validationResult.total.toLocaleString('en-IN') + ' directly to delivery executive upon physical package arrival.'
                              : 'Not available: One or more items in your cart require upfront Online Payment.'}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Option B: Razorpay Online Payment */}
                    {(() => {
                      const isRazorpayAvailable = !validationResult.allowedPaymentMethods || validationResult.allowedPaymentMethods.includes('razorpay');
                      const isSelected = selectedPaymentMethod === 'razorpay';
                      return (
                        <div
                          onClick={() => {
                            if (isRazorpayAvailable) setSelectedPaymentMethod('razorpay');
                          }}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                            !isRazorpayAvailable 
                              ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-50/70 border-emerald-600 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div>
                                <div>Razorpay Online Payment</div>
                                <div className="text-[10px] text-slate-500 font-normal">UPI, Cards, Net Banking</div>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={isSelected}
                              disabled={!isRazorpayAvailable}
                              onChange={() => setSelectedPaymentMethod('razorpay')}
                              className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </div>
                          <div className="mt-2.5 text-[11px] text-slate-600">
                            {isRazorpayAvailable 
                              ? 'Secure, encrypted transaction via Razorpay gateway. Supports Google Pay, PhonePe, Paytm, Cards, and Net Banking.'
                              : 'Not available: One or more items in your cart only accept Cash on Delivery.'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: ORDER CONFIRMATION */}
          {currentStep === 3 && createdOrderResult && (
            <div className="py-6 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border-2 border-emerald-300">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {createdOrderResult.paymentMethod === 'free'
                    ? 'Complimentary Access Confirmed'
                    : createdOrderResult.paymentMethod === 'COD' 
                    ? 'Order Placed (Cash on Delivery)' 
                    : 'Payment Verified & Order Confirmed'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {createdOrderResult.paymentMethod === 'free'
                    ? 'Your open-access publication order has been confirmed at zero cost. Download and access details are ready.'
                    : createdOrderResult.paymentMethod === 'COD'
                    ? 'Your purchase has been confirmed and authoritatively scheduled for fulfillment.'
                    : 'Your online payment has been securely verified and recorded on the trust ledger.'}
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Order Reference #</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                    {createdOrderResult.orderNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer Name</span>
                  <span className="font-bold text-slate-800">{fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-bold text-slate-900">
                    {createdOrderResult.paymentMethod === 'free'
                      ? 'Complimentary / Open Access (₹0)'
                      : createdOrderResult.paymentMethod === 'COD' 
                      ? 'Cash on Delivery (COD)' 
                      : 'Razorpay Online Payment'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order Status</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border capitalize ${
                    createdOrderResult.orderStatus === 'paid' || createdOrderResult.orderStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}>
                    {createdOrderResult.orderStatus?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Status</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                    createdOrderResult.paymentStatus === 'free'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : createdOrderResult.paymentStatus === 'captured' || createdOrderResult.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {createdOrderResult.paymentStatus || 'unpaid'}
                  </span>
                </div>
                {createdOrderResult.paymentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Gateway Payment ID</span>
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {createdOrderResult.paymentId}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black">
                  <span>Authoritative Total</span>
                  <span className="text-emerald-800">
                    ₹{createdOrderResult.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="max-w-md mx-auto p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed text-left">
                <div className="flex items-center gap-1.5 font-bold mb-0.5 text-emerald-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {createdOrderResult.paymentMethod === 'free'
                      ? 'Complimentary Access Granted'
                      : createdOrderResult.paymentMethod === 'COD' 
                      ? 'Cash on Delivery Fulfillment' 
                      : 'Verified Financial Transaction'}
                  </span>
                </div>
                {createdOrderResult.paymentMethod === 'free'
                  ? 'Your open-access publication is available for immediate download and has been recorded in your order ledger.'
                  : createdOrderResult.paymentMethod === 'COD' 
                  ? `Please keep exact cash of ₹${createdOrderResult.total.toLocaleString('en-IN')} ready for the courier. Store staff can record collection upon delivery.`
                  : 'An official transaction confirmation and tax invoice have been dispatched to ' + email + '.'}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {currentStep === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Back to Cart
              </button>
              <button
                type="button"
                onClick={handleProceedToReview}
                disabled={isValidating || !currentUser}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isValidating ? (
                  <span>Validating Authoritative Prices...</span>
                ) : (
                  <>
                    <span>Review Authoritative Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Address</span>
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || Boolean(validationResult?.hasPaymentMethodConflict)}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : selectedPaymentMethod === 'free' || validationResult?.total === 0 ? (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Complete Complimentary Order (₹0)</span>
                  </>
                ) : selectedPaymentMethod === 'COD' ? (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Place Order (Cash on Delivery)</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{validationResult?.total?.toLocaleString('en-IN')} via Razorpay</span>
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 3 && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div>
                {onViewOrderHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewOrderHistory();
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>View in My Orders</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Order Reference</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
