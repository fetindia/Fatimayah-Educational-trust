import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
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
  deleteDoc,
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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS for frontend clients (including fetindia.com, www.fetindia.com, and preview runtimes)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

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

// Helper: Clean object of undefined values for Firestore
function cleanObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

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
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const isConfigured = Boolean(keyId && keySecret);
  const isLive = keyId.startsWith('rzp_live');

  res.json({
    // Only return the public keyId when configured; never expose any secret or fallback credentials
    keyId: isConfigured ? keyId : '',
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
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 1) {
      res.status(400).json({
        error: 'Invalid amount. Minimum amount is ₹1.'
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
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (!rzp || !keyId || !keySecret) {
      res.status(500).json({
        error: 'Razorpay payment gateway is not configured on the server. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in the server environment.'
      });
      return;
    }

    const isLive = keyId.startsWith('rzp_live');
    const mode: 'test' | 'live' = isLive ? 'live' : 'test';

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
    const orderId = razorpayOrder.id;

    // Save pending contribution record in Firestore
    const now = new Date().toISOString();
    const donationData = cleanObject({
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
    });

    const donationsCollection = collection(db, 'campaign_donations');
    const docRef = await addDoc(donationsCollection, donationData);

    // Audit log
    try {
      await addDoc(collection(db, 'audit_logs'), cleanObject({
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
      }));
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
      isConfigured: true
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

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internalReference) {
      res.status(400).json({
        success: false,
        error: 'Missing mandatory payment verification fields.'
      });
      return;
    }

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!keySecret) {
      res.status(500).json({
        success: false,
        error: 'Razorpay server secret (RAZORPAY_KEY_SECRET) is not configured in server environment.'
      });
      return;
    }

    // Cryptographic HMAC SHA256 verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(razorpay_signature, 'utf8')
      );
    } catch {
      isSignatureValid = false;
    }

    // Locate the matching donation record in Firestore by internalReference or orderId
    const donationsCollection = collection(db, 'campaign_donations');
    let snap = await getDocs(query(donationsCollection, where('transactionReference', '==', internalReference)));
    if (snap.empty && razorpay_order_id) {
      snap = await getDocs(query(donationsCollection, where('razorpayOrderId', '==', razorpay_order_id)));
    }

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

    // Idempotency: Prevent duplicate processing if already verified
    if (donationData.paymentStatus === 'verified') {
      res.json({
        success: true,
        message: 'Payment was already verified.',
        receiptNumber: donationData.receiptNumber,
        internalReference: donationData.transactionReference,
        paymentId: donationData.razorpayPaymentId,
        amount: donationData.amount
      });
      return;
    }

    // Check if this payment ID was already used on another contribution (replay attack prevention)
    if (razorpay_payment_id) {
      const existingPaymentSnap = await getDocs(query(
        donationsCollection,
        where('razorpayPaymentId', '==', razorpay_payment_id),
        where('paymentStatus', '==', 'verified')
      ));
      if (!existingPaymentSnap.empty && existingPaymentSnap.docs[0].id !== donationDoc.id) {
        res.status(409).json({
          success: false,
          error: 'This Razorpay payment ID has already been credited to a verified contribution record.',
          receiptNumber: existingPaymentSnap.docs[0].data().receiptNumber
        });
        return;
      }
    }

    if (!isSignatureValid) {
      // Mark as failed in database
      await updateDoc(doc(db, 'campaign_donations', donationDoc.id), cleanObject({
        paymentStatus: 'failed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentError: 'Cryptographic signature mismatch',
        failedAt: now
      }));

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

    await updateDoc(doc(db, 'campaign_donations', donationDoc.id), cleanObject({
      paymentStatus: 'verified',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      verifiedAt: now,
      receiptNumber,
      financialYear,
      paymentMethod: 'Razorpay Payment Gateway (Verified)'
    }));

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
          await updateDoc(campaignRef, cleanObject({
            raisedAmount: totalRaised,
            verifiedDonationsCount: count,
            updatedAt: now
          }));
        }
      } catch (campErr) {
        console.warn('Campaign progress recalculation warning:', campErr);
      }
    }

    // Audit log
    try {
      await addDoc(collection(db, 'audit_logs'), cleanObject({
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
      }));
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
// 4b. RECORD CLIENT PAYMENT FAILURE / DISMISSAL
// -------------------------------------------------------------
app.post('/api/razorpay/record-failure', async (req: Request, res: Response) => {
  try {
    const { internalReference, razorpayOrderId, errorDescription } = req.body;
    if (!internalReference && !razorpayOrderId) {
      res.status(400).json({ error: 'Reference or order ID required.' });
      return;
    }

    const donationsCollection = collection(db, 'campaign_donations');
    let snap;
    if (internalReference) {
      snap = await getDocs(query(donationsCollection, where('transactionReference', '==', internalReference)));
    } else {
      snap = await getDocs(query(donationsCollection, where('razorpayOrderId', '==', razorpayOrderId)));
    }

    if (!snap.empty) {
      const dDoc = snap.docs[0];
      const dData = dDoc.data();
      // Only mark failed if still pending
      if (dData.paymentStatus === 'pending_verification') {
        await updateDoc(doc(db, 'campaign_donations', dDoc.id), cleanObject({
          paymentStatus: 'failed',
          paymentError: String(errorDescription || 'Payment interrupted or cancelled by user').substring(0, 250),
          failedAt: new Date().toISOString()
        }));
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
            await updateDoc(doc(db, 'campaign_donations', donationDoc.id), cleanObject({
              paymentStatus: 'verified',
              razorpayPaymentId: paymentId || prev.razorpayPaymentId || 'WEBHOOK_CAPTURED',
              verifiedAt: now,
              receiptNumber: prev.receiptNumber || `REC/80G/2026/${suffix}`,
              financialYear: '2026-27'
            }));
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
          await updateDoc(doc(db, 'campaign_donations', donationDoc.id), cleanObject({
            paymentStatus: 'failed',
            paymentError: paymentEntity?.error_description || 'Payment failed at gateway'
          }));
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
// 5b. EXAMINATION TIME ENFORCEMENT & SCHEDULE API
// -------------------------------------------------------------
function parseServerScheduleDate(dateStr: string, timeStr: string, timeZone = 'Asia/Kolkata'): number {
  if (!dateStr) return 0;
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return 0;
  const cleanDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  let hours = 9;
  let minutes = 0;
  if (timeStr) {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  const isoTime = `${pad(hours)}:${pad(minutes)}:00`;
  if (timeZone.toLowerCase().includes('kolkata') || timeZone.toLowerCase().includes('calcutta') || timeZone.toLowerCase().includes('ist')) {
    return Date.parse(`${cleanDate}T${isoTime}+05:30`);
  }
  return Date.parse(`${cleanDate}T${isoTime}Z`);
}

// Server Time check endpoint
app.get('/api/exam/server-time', (_req: Request, res: Response) => {
  res.json({
    serverTimeIso: new Date().toISOString(),
    serverTimestampMs: Date.now()
  });
});

// Helper to authoritatively verify candidate identity or administrative role
async function verifyCandidateOrAdmin(req: Request, expectedParticipantUid?: string): Promise<{ authorized: boolean; reason?: string }> {
  const authHeader = req.headers.authorization;
  const participantUid = (req.body?.participantUid || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null) || '').trim();
  
  if (!participantUid) {
    return { authorized: false, reason: 'Authentication required. Missing candidate identity credential.' };
  }
  
  // If the registration record specifies a participantUid, ensure matching identity or administrative role
  if (expectedParticipantUid && expectedParticipantUid !== participantUid) {
    try {
      const userSnap = await getDoc(doc(db, 'users', participantUid));
      if (userSnap.exists()) {
        const u = userSnap.data();
        if (
          u.role === 'super_admin' || 
          u.primaryRole === 'super_admin' || 
          u.roles?.includes('super_admin') || 
          u.roles?.includes('examination_admin') || 
          u.roles?.includes('exam_admin') || 
          u.roles?.includes('administrator')
        ) {
          return { authorized: true };
        }
      }
    } catch {
      // ignore
    }
    return { authorized: false, reason: 'Access forbidden. Candidate account does not match this registration record.' };
  }
  
  return { authorized: true };
}

// Server-authoritative Exam Attempt Starter & Validator
app.post('/api/exam/start-attempt', async (req: Request, res: Response) => {
  try {
    const { registrationId, competitionId } = req.body;
    if (!registrationId) {
      res.status(400).json({ error: 'registrationId is required.' });
      return;
    }

    const regRef = doc(db, 'competition_registrations', registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    const regData = regSnap.data();

    // Authoritative Candidate Session Authentication Guard
    const authCheck = await verifyCandidateOrAdmin(req, regData.participantUid);
    if (!authCheck.authorized) {
      res.status(401).json({
        allowed: false,
        error: authCheck.reason || 'Authentication required to start this examination.'
      });
      return;
    }
    const compDocId = competitionId || regData.competitionId;
    let compData: any = null;
    if (compDocId) {
      const compSnap = await getDoc(doc(db, 'competitions', compDocId));
      if (compSnap.exists()) {
        compData = compSnap.data();
      }
    }

    const now = Date.now();
    const nowIso = new Date().toISOString();

    // 1. Check if already submitted or finalized
    if (
      regData.examAttemptStatus === 'submitted' || 
      regData.examAttemptStatus === 'auto_submitted' || 
      regData.status === 'completed' || 
      regData.status === 'evaluated'
    ) {
      res.status(403).json({
        allowed: false,
        error: 'Examination attempt has already been submitted and finalized.',
        examAttemptStatus: regData.examAttemptStatus,
        alreadySubmitted: true
      });
      return;
    }

    // 2. Validate Examination Schedule Window (Strict Opening & Closing Window)
    const scheduleDate = compData?.examScheduleDate || compData?.examDetails?.examScheduleDate || compData?.competitionDate;
    const openTime = compData?.openingTime || compData?.examDetails?.openingTime || '09:00';
    const closeTime = compData?.closingTime || compData?.examDetails?.closingTime || '10:00';
    const timeZone = compData?.timeZone || compData?.examDetails?.timeZone || 'Asia/Kolkata';

    if (scheduleDate) {
      const openMs = parseServerScheduleDate(scheduleDate, openTime, timeZone);
      const closeMs = parseServerScheduleDate(scheduleDate, closeTime, timeZone);

      if (openMs && now < openMs) {
        res.status(403).json({
          allowed: false,
          error: `This examination is not open yet. It will open on ${scheduleDate} at ${openTime} (${timeZone}).`,
          isBeforeOpening: true,
          openTimestampMs: openMs
        });
        return;
      }

      if (closeMs && now > closeMs) {
        res.status(403).json({
          allowed: false,
          error: `Examination window has closed (${scheduleDate} at ${closeTime} ${timeZone}). Late attempts are strictly prohibited.`,
          isAfterClosing: true,
          closeTimestampMs: closeMs
        });
        return;
      }
    }

    // 3. Duration & Timer Enforcement
    const durationMinutes = Number(compData?.examDetails?.durationMinutes || 45);
    const durationSeconds = durationMinutes * 60;

    let examStartedAt = regData.examStartedAt;
    if (examStartedAt) {
      // Existing attempt in progress - Validate elapsed time authoritatively
      const startMs = new Date(examStartedAt).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000));
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      if (remainingSeconds <= 0) {
        // Time expired! Server immediately finalizes attempt
        await updateDoc(regRef, cleanObject({
          examAttemptStatus: 'auto_submitted',
          submissionReason: 'Auto-Submitted — Time Expired',
          submissionType: 'Auto-Submitted — Time Expired',
          submittedAt: nowIso,
          updatedAt: nowIso
        }));

        res.json({
          allowed: false,
          expired: true,
          error: 'Allocated examination time has expired. Your attempt has been automatically locked and submitted.',
          examAttemptStatus: 'auto_submitted',
          remainingSeconds: 0
        });
        return;
      }

      res.json({
        allowed: true,
        examStartedAt,
        durationMinutes,
        durationSeconds,
        remainingSeconds,
        serverTimeIso: nowIso
      });
      return;
    }

    // First time starting: set authoritative server start time
    examStartedAt = nowIso;
    await updateDoc(regRef, cleanObject({
      examStartedAt,
      examAttemptStatus: 'in_progress',
      updatedAt: nowIso
    }));

    res.json({
      allowed: true,
      examStartedAt,
      durationMinutes,
      durationSeconds,
      remainingSeconds: durationSeconds,
      serverTimeIso: nowIso
    });
  } catch (err: any) {
    console.error('Error starting exam attempt:', err);
    res.status(500).json({ error: err.message || 'Server error starting exam attempt.' });
  }
});

// Server-authoritative Exam Attempt Submitter & Result Evaluation
app.post('/api/exam/submit-attempt', async (req: Request, res: Response) => {
  try {
    const {
      registrationId,
      competitionId,
      answers = {},
      violations = [],
      selectedLanguage = 'en',
      isAutoExpired = false
    } = req.body;

    if (!registrationId) {
      res.status(400).json({ error: 'registrationId is required.' });
      return;
    }

    const regRef = doc(db, 'competition_registrations', registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    const regData = regSnap.data();

    // Authoritative Candidate Session Authentication Guard
    const authCheck = await verifyCandidateOrAdmin(req, regData.participantUid);
    if (!authCheck.authorized) {
      res.status(401).json({
        error: authCheck.reason || 'Authentication required to submit this examination attempt.'
      });
      return;
    }

    const compDocId = competitionId || regData.competitionId;
    let compData: any = null;
    if (compDocId) {
      const compSnap = await getDoc(doc(db, 'competitions', compDocId));
      if (compSnap.exists()) {
        compData = compSnap.data();
      }
    }

    const now = Date.now();
    const nowIso = new Date().toISOString();

    // Idempotency: If already submitted or evaluated, return existing result
    if (
      regData.examAttemptStatus === 'submitted' || 
      regData.examAttemptStatus === 'auto_submitted' || 
      regData.status === 'completed' || 
      regData.status === 'evaluated'
    ) {
      res.json({
        success: true,
        alreadySubmitted: true,
        marksObtained: regData.marksObtained || 0,
        totalMarks: regData.totalMarks || 100,
        percentage: regData.percentage || 0,
        status: regData.status,
        examAttemptStatus: regData.examAttemptStatus,
        submissionReason: regData.submissionReason || 'Auto-Submitted — Time Expired'
      });
      return;
    }

    // Server-Side Time Validation
    const durationMinutes = Number(compData?.examDetails?.durationMinutes || 45);
    const durationSeconds = durationMinutes * 60;
    const startMs = regData.examStartedAt ? new Date(regData.examStartedAt).getTime() : now;
    const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000));
    
    // Check if time expired: client flagged isAutoExpired OR elapsed >= durationSeconds
    const isExpired = Boolean(isAutoExpired || (elapsedSeconds >= durationSeconds));
    const submissionType = isExpired ? 'Auto-Submitted — Time Expired' : 'Manual Submission';
    const submissionReason = isExpired ? 'Auto-Submitted — Time Expired' : 'Candidate Manual Submission';
    const examAttemptStatus = isExpired ? 'auto_submitted' : 'submitted';

    // Objective scoring logic against competition questions
    let questions = compData?.examDetails?.questions || [];
    if ((!questions || questions.length === 0) && compData?.examDetails?.sections && compData.examDetails.sections.length > 0) {
      questions = [];
      compData.examDetails.sections.forEach((sec: any) => {
        if (Array.isArray(sec.questions)) {
          questions.push(...sec.questions);
        }
      });
    }
    let score = 0;
    let totalMarks = compData?.maxMarks || 100;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    if (questions.length > 0) {
      let calculatedTotal = 0;
      questions.forEach((q: any) => {
        const qMarks = q.marks || 4;
        calculatedTotal += qMarks;
        const candidateAns = answers[q.id];
        if (candidateAns !== undefined && candidateAns !== null && candidateAns !== '') {
          if (q.questionType === 'mcq' || q.questionType === 'true_false') {
            if (candidateAns === q.correctOptionIndex) {
              score += qMarks;
              correctCount++;
            } else {
              incorrectCount++;
              if (q.negativeMarks) {
                score = Math.max(0, score - q.negativeMarks);
              }
            }
          }
        } else {
          unansweredCount++;
        }
      });
      if (calculatedTotal > 0) {
        totalMarks = calculatedTotal;
      }
    }

    const percentage = Number(((score / totalMarks) * 100).toFixed(1));
    const passingMarks = compData?.passingMarks || 40;
    const passed = score >= passingMarks;

    let grade = 'Needs Improvement';
    if (percentage >= 90) grade = 'A+ (Distinction)';
    else if (percentage >= 75) grade = 'A (Excellent)';
    else if (percentage >= 60) grade = 'B (Good)';
    else if (percentage >= 40) grade = 'C (Pass)';

    const autoAward = passed ? 'merit' : 'participation';
    const shouldAutoPublish = compData?.autoPublishResults === true;

    // Update Registration in Firestore
    await updateDoc(regRef, cleanObject({
      status: passed ? 'completed' : 'evaluated',
      examAttemptStatus,
      submissionReason,
      submissionType,
      marksObtained: score,
      totalMarks,
      percentage,
      grade,
      awardCategory: autoAward,
      evaluatorRemarks: `${submissionReason}. Academic Evaluation System: Scored ${score}/${totalMarks} (${percentage}% - ${grade}).`,
      evaluatedAt: nowIso,
      submittedAnswers: answers,
      submittedAt: nowIso,
      timeTakenMinutes: Math.min(durationMinutes, Math.ceil(elapsedSeconds / 60)),
      violations,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      unansweredCount,
      isResultPublished: shouldAutoPublish,
      resultsPublishedAt: shouldAutoPublish ? nowIso : undefined,
      updatedAt: nowIso
    }));

    // Record in exam_attempts collection
    await setDoc(doc(db, 'exam_attempts', `att-${registrationId}`), cleanObject({
      registrationId,
      participantId: regData.participantId,
      competitionId: compDocId,
      competitionTitle: compData?.title || regData.competitionTitle,
      participantUid: regData.participantUid,
      participantName: regData.participantName || regData.candidateName,
      submittedAt: nowIso,
      timeSpentSeconds: Math.min(durationSeconds, elapsedSeconds),
      selectedLanguage,
      answers,
      autoScore: score,
      totalMarks,
      percentage,
      grade,
      awardCategory: autoAward,
      status: 'evaluated',
      submissionType,
      submissionReason,
      isAutoExpired: isExpired,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      unansweredCount,
      isResultPublished: shouldAutoPublish,
      violationsCount: violations.length,
      violations
    }));

    res.json({
      success: true,
      examAttemptStatus,
      submissionReason,
      submissionType,
      isAutoExpired: isExpired,
      marksObtained: score,
      totalMarks,
      percentage,
      grade,
      status: passed ? 'Passed' : 'Completed'
    });
  } catch (err: any) {
    console.error('Error submitting exam attempt:', err);
    res.status(500).json({ error: err.message || 'Server error submitting exam attempt.' });
  }
});

// Server-authoritative Real-Time Answer Persistence Endpoint
app.post('/api/exam/save-answers', async (req: Request, res: Response) => {
  try {
    const { registrationId, answers = {}, timeSpentSeconds } = req.body;
    if (!registrationId) {
      res.status(400).json({ error: 'registrationId is required.' });
      return;
    }

    const regRef = doc(db, 'competition_registrations', registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }
    const regData = regSnap.data();

    // Authoritative Candidate Session Authentication Guard
    const authCheck = await verifyCandidateOrAdmin(req, regData.participantUid);
    if (!authCheck.authorized) {
      res.status(401).json({ error: authCheck.reason || 'Authentication required to persist answers.' });
      return;
    }

    const nowIso = new Date().toISOString();
    await updateDoc(regRef, cleanObject({
      submittedAnswers: answers,
      lastAnsweredAt: nowIso,
      updatedAt: nowIso,
      ...(timeSpentSeconds !== undefined ? { timeSpentSeconds } : {})
    }));

    res.json({ success: true, savedAt: nowIso });
  } catch (err: any) {
    console.warn('Real-time save warning:', err);
    res.status(500).json({ error: err.message || 'Failed to persist answers' });
  }
});

// Server-authoritative Competition Deletion & Archival Guard (Super Admin Only)
app.post('/api/competitions/delete', async (req: Request, res: Response) => {
  try {
    const { competitionId, adminUid, adminEmail, mode = 'archive' } = req.body;

    if (!competitionId) {
      res.status(400).json({ error: 'competitionId is required.' });
      return;
    }

    // 1. Authoritative Super Admin Verification
    let isSuperAdmin = false;
    const normalizedEmail = (adminEmail || '').trim().toLowerCase();
    if (normalizedEmail === 'fetkofficial@gmail.com') {
      isSuperAdmin = true;
    } else if (adminUid) {
      const userSnap = await getDoc(doc(db, 'users', adminUid));
      if (userSnap.exists()) {
        const udata = userSnap.data();
        if (
          udata.role === 'super_admin' || 
          udata.primaryRole === 'super_admin' || 
          (Array.isArray(udata.roles) && udata.roles.includes('super_admin')) ||
          (udata.email || '').toLowerCase() === 'fetkofficial@gmail.com'
        ) {
          isSuperAdmin = true;
        }
      }
    }

    if (!isSuperAdmin) {
      res.status(403).json({ 
        error: 'Permission Denied: ONLY Super Admin can delete or archive a competition. Exam Controllers do not possess deletion authority.' 
      });
      return;
    }

    const compRef = doc(db, 'competitions', competitionId);
    const compSnap = await getDoc(compRef);
    if (!compSnap.exists()) {
      res.status(404).json({ error: 'Competition record not found.' });
      return;
    }

    const compData = compSnap.data();
    const nowIso = new Date().toISOString();

    if (mode === 'permanent') {
      // Permanent removal of the competition record from catalog
      // NOTE: Historical registrations, payments, attempts, and certificates remain intact in Firestore
      await deleteDoc(compRef);

      // Record audit log
      try {
        await addDoc(collection(db, 'audit_logs'), cleanObject({
          action: 'competition.permanently_deleted',
          competitionId,
          competitionTitle: compData.title,
          competitionCode: compData.code,
          performedByUid: adminUid,
          performedByEmail: adminEmail,
          timestamp: nowIso,
          details: `Super Admin permanently deleted competition "${compData.title}". Historical registrations, attempts, and certificate records were preserved.`
        }));
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }

      res.json({
        success: true,
        mode: 'permanent',
        message: `Competition "${compData.title}" was permanently removed. Historical candidate and financial records are preserved.`
      });
      return;
    }

    // Default & Recommended: Soft-delete / Archive
    await updateDoc(compRef, cleanObject({
      isDeleted: true,
      status: 'archived',
      archivedAt: nowIso,
      deletedAt: nowIso,
      deletedByUid: adminUid,
      deletedByEmail: adminEmail,
      updatedAt: nowIso
    }));

    try {
      await addDoc(collection(db, 'audit_logs'), cleanObject({
        action: 'competition.archived',
        competitionId,
        competitionTitle: compData.title,
        competitionCode: compData.code,
        performedByUid: adminUid,
        performedByEmail: adminEmail,
        timestamp: nowIso,
        details: `Super Admin soft-deleted/archived competition "${compData.title}". Candidate records remain secure.`
      }));
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr);
    }

    res.json({
      success: true,
      mode: 'archived',
      message: `Competition "${compData.title}" archived successfully. Historical candidate records remain protected.`
    });
  } catch (err: any) {
    console.error('Error deleting/archiving competition:', err);
    res.status(500).json({ error: err.message || 'Server error processing competition deletion.' });
  }
});

// -------------------------------------------------------------
// 6. VITE MIDDLEWARE (Dev) & STATIC SERVING (Prod)
// -------------------------------------------------------------
async function initServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      },
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`FET India Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error('Fatal error starting FET India server:', err);
});
