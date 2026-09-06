import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfigData from './firebase-applet-config.json';

// Load local environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Firebase server connection
const firebaseApp = initializeApp(firebaseConfigData);
const db = getFirestore(firebaseApp, firebaseConfigData.firestoreDatabaseId);

// Middleware for parsing JSON with raw body retention for webhook verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

// Helper: Get Razorpay Client or null
function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && keyId.trim() && keySecret.trim()) {
    try {
      return new Razorpay({
        key_id: keyId.trim(),
        key_secret: keySecret.trim()
      });
    } catch (err) {
      console.error('Error initializing Razorpay client:', err);
      return null;
    }
  }
  return null;
}

// -------------------------------------------------------------
// 1. HEALTH CHECK
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FET India Payment Gateway & API'
  });
});

// -------------------------------------------------------------
// 2. GET RAZORPAY CONFIGURATION (Client-safe metadata only)
// -------------------------------------------------------------
app.get('/api/razorpay/config', (_req: Request, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const isConfigured = Boolean(keyId && keySecret);
  const isLive = keyId.startsWith('rzp_live');

  res.json({
    // Return keyId if configured, or a fallback test identifier
    keyId: keyId || 'rzp_test_FET_INDIA_TESTMODE',
    isConfigured,
    mode: isLive ? 'live' : 'test',
    currency: 'INR',
    merchantName: 'Fatimyah Educational Trust',
    supportEmail: 'fetkofficial@gmail.com',
    supportPhone: '+91 98923 00000',
    trust80GNumber: 'AAATF2843PF20214',
    description: '80G Certified Educational and Welfare Contributions'
  });
});

// -------------------------------------------------------------
// 3. CREATE RAZORPAY ORDER
// -------------------------------------------------------------
app.post('/api/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const {
      amount,
      donorName,
      donorEmail,
      donorPhone,
      donorPan,
      campaignId = 'direct-80g-trust-allocation',
      campaignTitle = 'General Trust Allocation',
      donorUid,
      isAnonymous = false,
      message = ''
    } = req.body;

    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
      res.status(400).json({
        error: 'Invalid contribution amount. Minimum contribution amount is ₹100.'
      });
      return;
    }

    if (!donorName || typeof donorName !== 'string' || !donorName.trim()) {
      res.status(400).json({
        error: 'Donor name is required for 80G tax certification.'
      });
      return;
    }

    if (!donorEmail || typeof donorEmail !== 'string' || !donorEmail.trim()) {
      res.status(400).json({
        error: 'Donor email is required for 80G tax receipt dispatch.'
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const cleanAmount = Math.round(numericAmount);
    const amountInPaise = cleanAmount * 100;
    const internalReference = `FET-DON-${currentYear}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const rzp = getRazorpayClient();
    let orderId: string;
    let mode: 'test' | 'live' = 'test';
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_FET_INDIA_TESTMODE';

    if (rzp && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      // Official Razorpay API order creation
      mode = process.env.RAZORPAY_KEY_ID.startsWith('rzp_live') ? 'live' : 'test';
      const orderOptions = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: internalReference,
        notes: {
          internalReference,
          campaignId: String(campaignId),
          campaignTitle: String(campaignTitle).substring(0, 40),
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPan: donorPan ? String(donorPan).trim().toUpperCase() : 'NOT_PROVIDED'
        }
      };

      const razorpayOrder = await rzp.orders.create(orderOptions);
      orderId = razorpayOrder.id;
    } else {
      // Test simulation mode (allows full development and automated testing before keys injected)
      orderId = `order_test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      mode = 'test';
    }

    // Save pending contribution record in Firestore
    const now = new Date().toISOString();
    const donationData = {
      donationId: internalReference,
      campaignId,
      campaignTitle,
      donorUid: donorUid || null,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone ? String(donorPhone).trim() : null,
      donorPan: donorPan ? String(donorPan).trim().toUpperCase() : null,
      amount: cleanAmount,
      createdAt: now,
      paymentStatus: 'pending_verification',
      transactionReference: internalReference,
      paymentMethod: 'Razorpay Payment Gateway',
      razorpayOrderId: orderId,
      gatewayMode: mode,
      isAnonymous: Boolean(isAnonymous),
      message: message ? String(message).trim() : ''
    };

    const donationsCollection = collection(db, 'campaign_donations');
    const docRef = await addDoc(donationsCollection, donationData);

    // Audit log
    try {
      await addDoc(collection(db, 'audit_logs'), {
        actorUid: donorUid || 'donor_public',
        actorEmail: donorEmail,
        actorRole: 'user',
        action: 'RAZORPAY_ORDER_CREATED',
        targetEntity: 'campaign_donations',
        targetId: docRef.id,
        timestamp: now,
        serverTimestamp: serverTimestamp(),
        details: {
          internalReference,
          orderId,
          amount: cleanAmount,
          mode
        }
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning:', auditErr);
    }

    res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      internalReference,
      docId: docRef.id,
      keyId,
      mode,
      isConfigured: Boolean(rzp)
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      error: error.message || 'Failed to create Razorpay contribution order.'
    });
  }
});

// -------------------------------------------------------------
// 4. VERIFY PAYMENT (Cryptographic HMAC SHA256 Signature Verification)
// -------------------------------------------------------------
app.post('/api/razorpay/verify-payment', async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internalReference,
      campaignId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !internalReference) {
      res.status(400).json({
        success: false,
        error: 'Missing mandatory payment verification fields.'
      });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isLive = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live');

    let isSignatureValid = false;

    if (keySecret && razorpay_signature) {
      // Production HMAC SHA256 verification
      const expectedSignature = crypto
        .createHmac('sha256', keySecret.trim())
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      try {
        isSignatureValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf8'),
          Buffer.from(razorpay_signature, 'utf8')
        );
      } catch {
        isSignatureValid = false;
      }
    } else if (!keySecret && !isLive) {
      // In development/test mode before secret is injected:
      // Allow verification if valid mock test payment ID structure is supplied
      isSignatureValid = razorpay_payment_id.startsWith('pay_');
    }

    // Locate the matching donation record in Firestore
    const donationsCollection = collection(db, 'campaign_donations');
    const q = query(donationsCollection, where('transactionReference', '==', internalReference));
    const snap = await getDocs(q);

    if (snap.empty) {
      res.status(404).json({
        success: false,
        error: `Donation record ${internalReference} not found in database.`
      });
      return;
    }

    const donationDoc = snap.docs[0];
    const donationData = donationDoc.data();
    const now = new Date().toISOString();

    // Prevent duplicate processing if already verified
    if (donationData.paymentStatus === 'verified') {
      res.json({
        success: true,
        message: 'Payment was already verified.',
        receiptNumber: donationData.receiptNumber,
        internalReference: donationData.transactionReference,
        paymentId: donationData.razorpayPaymentId
      });
      return;
    }

    if (!isSignatureValid) {
      // Mark as failed in database
      await updateDoc(doc(db, 'campaign_donations', donationDoc.id), {
        paymentStatus: 'failed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentError: 'Cryptographic signature mismatch'
      });

      res.status(400).json({
        success: false,
        error: 'Cryptographic signature verification failed. Trust funds not credited.'
      });
      return;
    }

    // Signature verified! Generate official 80G receipt number
    const suffix = internalReference.split('-').pop() || crypto.randomBytes(3).toString('hex').toUpperCase();
    const receiptNumber = `REC/80G/2026/${suffix}`;
    const financialYear = '2026-27';

    await updateDoc(doc(db, 'campaign_donations', donationDoc.id), {
      paymentStatus: 'verified',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || 'TEST_VERIFIED',
      verifiedAt: now,
      receiptNumber,
      financialYear,
      paymentMethod: 'Razorpay Payment Gateway (Verified)'
    });

    // Recalculate campaign progress if campaignId is supplied and not general
    const effectiveCampaignId = campaignId || donationData.campaignId;
    if (effectiveCampaignId && effectiveCampaignId !== 'direct-80g-trust-allocation') {
      try {
        const allVerifiedQuery = query(
          donationsCollection,
          where('campaignId', '==', effectiveCampaignId),
          where('paymentStatus', '==', 'verified')
        );
        const verifiedSnap = await getDocs(allVerifiedQuery);
        let totalRaised = 0;
        let count = 0;
        verifiedSnap.forEach((d) => {
          totalRaised += Number(d.data().amount) || 0;
          count += 1;
        });

        const campaignRef = doc(db, 'crowdfunding_campaigns', effectiveCampaignId);
        const campaignDocSnap = await getDoc(campaignRef);
        if (campaignDocSnap.exists()) {
          await updateDoc(campaignRef, {
            raisedAmount: totalRaised,
            verifiedDonationsCount: count,
            updatedAt: now
          });
        }
      } catch (campErr) {
        console.warn('Campaign progress recalculation warning:', campErr);
      }
    }

    // Audit log
    try {
      await addDoc(collection(db, 'audit_logs'), {
        actorUid: donationData.donorUid || 'donor_public',
        actorEmail: donationData.donorEmail || 'donor@fetindia.com',
        actorRole: 'user',
        action: 'RAZORPAY_PAYMENT_VERIFIED',
        targetEntity: 'campaign_donations',
        targetId: donationDoc.id,
        timestamp: now,
        serverTimestamp: serverTimestamp(),
        details: {
          internalReference,
          razorpay_payment_id,
          receiptNumber,
          amount: donationData.amount,
          financialYear
        }
      });
    } catch (auditErr) {
      console.warn('Non-blocking audit log warning:', auditErr);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully and official 80G tax exemption receipt issued.',
      receiptNumber,
      internalReference,
      paymentId: razorpay_payment_id,
      amount: donationData.amount
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment verification encountered an internal error.'
    });
  }
});

// -------------------------------------------------------------
// 5. RAZORPAY WEBHOOK HANDLER
// -------------------------------------------------------------
app.post('/api/razorpay/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const razorpaySignature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (webhookSecret && razorpaySignature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret.trim())
        .update(rawBody)
        .digest('hex');

      const isSigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(razorpaySignature, 'utf8')
      );

      if (!isSigValid) {
        res.status(400).json({ error: 'Invalid webhook signature.' });
        return;
      }
    }

    const event = req.body;
    const eventType = event.event;

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      const internalReference = paymentEntity?.notes?.internalReference;

      if (orderId || internalReference) {
        const donationsCollection = collection(db, 'campaign_donations');
        let snap;
        if (internalReference) {
          snap = await getDocs(query(donationsCollection, where('transactionReference', '==', internalReference)));
        } else {
          snap = await getDocs(query(donationsCollection, where('razorpayOrderId', '==', orderId)));
        }

        if (!snap.empty) {
          const donationDoc = snap.docs[0];
          const prev = donationDoc.data();
          if (prev.paymentStatus !== 'verified') {
            const now = new Date().toISOString();
            const suffix = prev.transactionReference?.split('-').pop() || crypto.randomBytes(3).toString('hex').toUpperCase();
            await updateDoc(doc(db, 'campaign_donations', donationDoc.id), {
              paymentStatus: 'verified',
              razorpayPaymentId: paymentId || prev.razorpayPaymentId || 'WEBHOOK_CAPTURED',
              verifiedAt: now,
              receiptNumber: prev.receiptNumber || `REC/80G/2026/${suffix}`,
              financialYear: '2026-27'
            });
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const internalReference = paymentEntity?.notes?.internalReference;
      if (internalReference) {
        const snap = await getDocs(query(collection(db, 'campaign_donations'), where('transactionReference', '==', internalReference)));
        if (!snap.empty) {
          const donationDoc = snap.docs[0];
          await updateDoc(doc(db, 'campaign_donations', donationDoc.id), {
            paymentStatus: 'failed',
            paymentError: paymentEntity?.error_description || 'Payment failed at gateway'
          });
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (webhookErr: any) {
    console.error('Razorpay Webhook Error:', webhookErr);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

// -------------------------------------------------------------
// 6. VITE MIDDLEWARE (Dev) & STATIC SERVING (Prod)
// -------------------------------------------------------------
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FET India Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error('Fatal error starting FET India server:', err);
});
