/**
 * @license
 * Competition & Examination Registration Modal
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Building, 
  User, 
  Phone, 
  Mail, 
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Lock,
  Download,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Competition, CompetitionRegistration } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { db, cleanFirestoreData } from '../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initiateRazorpayContribution, PaymentVerificationResult } from '../../lib/razorpay';

interface CompetitionRegistrationModalProps {
  competition: Competition;
  onClose: () => void;
  onSuccess?: (registrationId: string) => void;
  isOpen?: boolean;
  onOpenAuth?: () => void;
}

export const CompetitionRegistrationModal: React.FC<CompetitionRegistrationModalProps> = ({
  competition,
  onClose,
  onSuccess,
  isOpen = true,
  onOpenAuth
}) => {
  const { currentUser, userProfile } = useAuth();
  const profileAny = userProfile as any;

  const [formData, setFormData] = useState({
    participantName: userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || '',
    parentName: profileAny?.parentName || profileAny?.guardianName || '',
    dateOfBirth: userProfile?.dateOfBirth || '',
    gender: userProfile?.gender || 'Male',
    mobileNumber: userProfile?.mobileNumber || userProfile?.phoneNumber || '',
    email: userProfile?.email || currentUser?.email || '',
    country: userProfile?.country || 'India',
    state: userProfile?.state || 'Maharashtra',
    district: userProfile?.district || userProfile?.city || 'Mumbai',
    schoolInstitution: profileAny?.schoolName || profileAny?.collegeName || profileAny?.institution || 'St. Xavier High School & Junior College',
    classGrade: profileAny?.classGrade || profileAny?.standard || (competition.eligibleClasses[0] || 'Class 9th'),
    agreeRules: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    participantId: string;
    registrationDocId: string;
    candidateName: string;
    isPaid: boolean;
    amount: number;
    bookMaterialUrl?: string;
    bookExternalUrl?: string;
    bookTitle?: string;
    bookAuthor?: string;
    requiredChapters?: string;
    bookFileName?: string;
    bookFileSizeBytes?: number;
  } | null>(null);
  const [isDownloadingBook, setIsDownloadingBook] = useState(false);
  const [downloadBookError, setDownloadBookError] = useState<string | null>(null);

  // Check for existing saved registration on open to prevent duplicate registration and support revisit
  useEffect(() => {
    if (!isOpen || !currentUser?.uid || !competition?.id) return;
    const docId = `reg-${competition.id}-${currentUser.uid}`;
    getDoc(doc(db, 'competition_registrations', docId))
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const resolvedBookUrl = competition.pdfReadingMaterialUrl || competition.bookDetails?.pdfReadingMaterialUrl;
          const resolvedBookExt = competition.bookDetails?.pdfExternalUrl || (competition.pdfSourceType === 'external_url' ? competition.pdfReadingMaterialUrl : undefined);
          setSuccessData({
            participantId: data.participantId || `FET-PRT-${docSnap.id.slice(-6)}`,
            registrationDocId: docSnap.id,
            candidateName: data.participantName || currentUser.displayName || 'Candidate',
            isPaid: Boolean(data.isPaid),
            amount: data.participationFee || 0,
            bookMaterialUrl: resolvedBookUrl,
            bookExternalUrl: resolvedBookExt,
            bookTitle: competition.bookDetails?.bookTitle || competition.title,
            bookAuthor: competition.bookDetails?.author,
            requiredChapters: competition.bookDetails?.requiredChapters,
            bookFileName: competition.pdfFileName || competition.bookDetails?.pdfFileName,
            bookFileSizeBytes: competition.pdfFileSizeBytes || competition.bookDetails?.pdfFileSizeBytes
          });
        }
      })
      .catch((err) => {
        console.warn('Existing registration lookup notice:', err);
      });
  }, [isOpen, currentUser?.uid, competition?.id]);

  const handleDownloadOfficialBook = async () => {
    setIsDownloadingBook(true);
    setDownloadBookError(null);

    try {
      const compId = competition.id || 'general';
      const candidateUid = currentUser?.uid || '';
      const candidateCode = competition.code || 'FET-CMP';
      const customFilename = successData?.bookFileName || competition.pdfFileName || competition.bookDetails?.pdfFileName || `${candidateCode}_Official_Competition_Book.pdf`;
      const safeFilename = customFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const regDocId = successData?.registrationDocId || `reg-${compId}-${candidateUid}`;
      const prtId = successData?.participantId || '';
      const payStatus = successData?.isPaid ? 'paid' : 'free';

      const targetEndpoint = `/api/competitions/${compId}/material?uid=${encodeURIComponent(candidateUid)}&regId=${encodeURIComponent(regDocId)}&prtId=${encodeURIComponent(prtId)}&payStatus=${encodeURIComponent(payStatus)}`;
      let downloadBlob: Blob | null = null;

      try {
        const resp = await fetch(targetEndpoint, {
          headers: {
            'x-user-uid': candidateUid,
            'x-registration-id': regDocId,
            'x-participant-id': prtId,
            'x-payment-status': payStatus
          }
        });
        if (resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
            downloadBlob = await resp.blob();
          } else {
            const err = await resp.json().catch(() => null);
            if (err?.error) throw new Error(err.error);
          }
        } else if (resp.status === 403) {
          const err = await resp.json().catch(() => null);
          throw new Error(err?.error || 'Candidate registration verification required to download official study material.');
        } else if (!resp.ok) {
          const err = await resp.json().catch(() => null);
          throw new Error(err?.error || 'Official competition PDF is currently being prepared by the Examination Board.');
        }
      } catch (endpointErr: any) {
        if (endpointErr?.message && endpointErr.message.includes('verification')) {
          throw endpointErr;
        }
        console.warn('Backend download notice, checking direct stream fallback:', endpointErr);
      }

      const directUrl = successData?.bookMaterialUrl || competition.pdfReadingMaterialUrl || competition.bookDetails?.pdfReadingMaterialUrl;
      if (!downloadBlob && directUrl && (directUrl.startsWith('http://') || directUrl.startsWith('https://')) && !directUrl.includes('/api/competitions/')) {
        try {
          const dResp = await fetch(directUrl);
          if (dResp.ok) {
            downloadBlob = await dResp.blob();
          }
        } catch {
          // Fallback handled below
        }
      }

      if (downloadBlob) {
        const blobUrl = window.URL.createObjectURL(downloadBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      } else if (directUrl && directUrl.startsWith('data:application/pdf;base64,')) {
        const link = document.createElement('a');
        link.href = directUrl;
        link.download = safeFilename.endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Official competition PDF is being prepared by the Examination Board. It will also be accessible from your Student Dashboard.');
      }
    } catch (err: any) {
      setDownloadBookError(err?.message || 'Failed to download official PDF book.');
    } finally {
      setIsDownloadingBook(false);
    }
  };

  // Check deadline
  const isRegistrationClosed = competition.registrationEndDate 
    ? new Date(competition.registrationEndDate) < new Date(new Date().toISOString().split('T')[0])
    : false;

  const isCapacityFull = competition.maxParticipants 
    ? competition.registeredCount >= competition.maxParticipants
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('Please sign in to register for this competition.');
      return;
    }

    if (!formData.participantName.trim()) {
      setErrorMsg('Participant full name is required.');
      return;
    }

    if (!formData.mobileNumber.trim()) {
      setErrorMsg('Active WhatsApp / Mobile number is required.');
      return;
    }

    if (!formData.schoolInstitution.trim()) {
      setErrorMsg('School / College / Institution name is required.');
      return;
    }

    if (!formData.agreeRules) {
      setErrorMsg('You must agree to the academic guidelines and competition rules.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const isPaidExam = Boolean(competition.isPaid && (competition.participationFee ?? 0) > 0);
    const feeAmount = competition.participationFee || 0;

    const executeRegistrationSave = async (paymentDetails?: {
      orderId?: string;
      paymentId?: string;
      paymentStatus: 'free' | 'paid';
      amount: number;
    }) => {
      try {
        const registrationDocId = `reg-${competition.id || 'cmp'}-${currentUser.uid}`;
        const bookUrl = competition.pdfReadingMaterialUrl || competition.bookDetails?.pdfReadingMaterialUrl;
        const bookExt = competition.bookDetails?.pdfExternalUrl || (competition.pdfSourceType === 'external_url' ? competition.pdfReadingMaterialUrl : undefined);
        const bookTitle = competition.bookDetails?.bookTitle || competition.title;
        const bookAuthor = competition.bookDetails?.author;
        const requiredChapters = competition.bookDetails?.requiredChapters;

        // 1. Prevent duplicate registration when page is refreshed or submission retried
        const existingSnap = await getDoc(doc(db, 'competition_registrations', registrationDocId)).catch(() => null);
        if (existingSnap && existingSnap.exists()) {
          const existing = existingSnap.data() as CompetitionRegistration;
          setSuccessData({
            participantId: existing.participantId,
            registrationDocId,
            candidateName: existing.participantName || formData.participantName.trim(),
            isPaid: Boolean(existing.isPaid),
            amount: existing.participationFee || 0,
            bookMaterialUrl: bookUrl,
            bookExternalUrl: bookExt,
            bookTitle,
            bookAuthor,
            requiredChapters,
            bookFileName: competition.pdfFileName || competition.bookDetails?.pdfFileName,
            bookFileSizeBytes: competition.pdfFileSizeBytes || competition.bookDetails?.pdfFileSizeBytes
          });
          if (onSuccess) onSuccess(registrationDocId);
          return;
        }

        // Generate Unique Participant Roll ID
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const participantId = `FET-PRT-${new Date().getFullYear()}-${randomSuffix}`;

        const newRegistration: CompetitionRegistration = {
          registrationId: registrationDocId,
          participantId: participantId,
          competitionId: competition.id || 'cmp-default',
          competitionCode: competition.code,
          competitionTitle: competition.title,
          competitionCategory: competition.category,
          
          participantUid: currentUser.uid,
          participantName: formData.participantName.trim(),
          parentName: formData.parentName.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          mobileNumber: formData.mobileNumber.trim(),
          email: formData.email.trim(),
          country: formData.country.trim(),
          state: formData.state.trim(),
          district: formData.district.trim(),
          schoolInstitution: formData.schoolInstitution.trim(),
          classGrade: formData.classGrade,

          // Payment Metadata
          isPaid: isPaidExam,
          participationFee: feeAmount,
          paymentFeeAmount: paymentDetails?.amount || 0,
          paymentStatus: paymentDetails?.paymentStatus || (isPaidExam ? 'paid' : 'free'),
          orderId: paymentDetails?.orderId,
          paymentId: paymentDetails?.paymentId,
          paymentCompletedAt: paymentDetails ? new Date().toISOString() : undefined,

          registeredAt: new Date().toISOString(),
          status: 'registered',
          examAttemptStatus: 'not_started',
          totalMarks: competition.maxMarks,
          isResultPublished: false,
          certificateIssued: false,
          updatedAt: new Date().toISOString(),

          // Test vs Live Environment Separation
          isTestRegistration: Boolean(competition.isTestCompetition || competition.environment === 'test'),
          environment: (competition.environment || (competition.isTestCompetition ? 'test' : 'live')) as 'live' | 'test'
        };

        // Write to Firestore
        await setDoc(doc(db, 'competition_registrations', registrationDocId), cleanFirestoreData(newRegistration));

        // Authoritatively verify save succeeded in database before presenting success screen
        const verifySnap = await getDoc(doc(db, 'competition_registrations', registrationDocId));
        if (!verifySnap.exists()) {
          throw new Error('Registration verification failed: Saved record could not be confirmed in the database. Please try again.');
        }

        // Increment registered count in competition document
        if (competition.id) {
          const compRef = doc(db, 'competitions', competition.id);
          await updateDoc(compRef, {
            registeredCount: increment(1),
            updatedAt: new Date().toISOString()
          }).catch(() => {
            // ignore if document does not exist yet
          });
        }

        // Record in In-App Notifications for Candidate
        await addDoc(collection(db, 'user_notifications'), cleanFirestoreData({
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          title: `Registration Confirmed: ${competition.title}`,
          message: `You have successfully enrolled in ${competition.title}. Your assigned Participant Roll ID is ${participantId}${isPaidExam ? ` (Examination Fee Paid: ₹${feeAmount})` : ''}.`,
          type: 'competition_registration',
          module: 'exams',
          read: false,
          createdAt: new Date().toISOString()
        })).catch(() => {});

        // Record in Audit Log
        await addDoc(collection(db, 'audit_logs'), cleanFirestoreData({
          action: 'COMPETITION_REGISTRATION_CREATED',
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          details: `Registered candidate ${formData.participantName} for ${competition.title} with Participant ID ${participantId}${isPaidExam ? ` (Paid: ₹${feeAmount})` : ' (Free)'}`,
          timestamp: new Date().toISOString()
        })).catch(() => {});

        // AUTOMATIC STUDY MATERIAL DELIVERY:
        // For Paid: Immediately trigger automatic download of PDF where supported
        if (isPaidExam && bookUrl) {
          try {
            const dlLink = document.createElement('a');
            dlLink.href = bookUrl;
            dlLink.download = `${(competition.code || 'FET').replace(/[^a-zA-Z0-9_-]/g, '_')}_Study_Material.pdf`;
            dlLink.target = '_blank';
            dlLink.rel = 'noopener noreferrer';
            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);
          } catch (autoErr) {
            console.warn('Browser prevented automated download trigger; manual button provided.', autoErr);
          }
        } else if (isPaidExam && bookExt) {
          try {
            window.open(bookExt, '_blank', 'noopener,noreferrer');
          } catch (autoOpenErr) {
            console.warn('Browser prevented automated link open; manual button provided.', autoOpenErr);
          }
        }

        setSuccessData({
          participantId,
          registrationDocId,
          candidateName: formData.participantName.trim(),
          isPaid: isPaidExam,
          amount: feeAmount,
          bookMaterialUrl: bookUrl,
          bookExternalUrl: bookExt,
          bookTitle,
          bookAuthor,
          requiredChapters,
          bookFileName: competition.pdfFileName || competition.bookDetails?.pdfFileName,
          bookFileSizeBytes: competition.pdfFileSizeBytes || competition.bookDetails?.pdfFileSizeBytes
        });

        if (onSuccess) {
          onSuccess(registrationDocId);
        }
      } catch (err: any) {
        console.error('Error submitting competition registration:', err);
        setErrorMsg(err?.message || 'Failed to submit registration. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (isPaidExam) {
      try {
        await initiateRazorpayContribution({
          orderParams: {
            amount: feeAmount,
            donorName: formData.participantName.trim(),
            donorEmail: formData.email.trim(),
            donorPhone: formData.mobileNumber.trim(),
            campaignId: competition.id || 'examination_fee',
            campaignTitle: `Examination Fee: ${competition.title}`,
            donorUid: currentUser.uid
          },
          preferredMethod: 'all',
          onSuccess: async (result: PaymentVerificationResult) => {
            await executeRegistrationSave({
              orderId: result.internalReference || result.receiptNumber || 'EXAM-ORDER',
              paymentId: result.paymentId || 'PAY-ONLINE',
              paymentStatus: 'paid',
              amount: feeAmount
            });
          },
          onError: (errorMessage: string) => {
            setIsSubmitting(false);
            setErrorMsg(`Payment error: ${errorMessage}`);
          },
          onDismiss: () => {
            setIsSubmitting(false);
          }
        });
      } catch (payErr: any) {
        setIsSubmitting(false);
        setErrorMsg(payErr?.message || 'Failed to launch secure payment gateway.');
      }
    } else {
      // Free examination
      await executeRegistrationSave({
        paymentStatus: 'free',
        amount: 0
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" id="fet-competition-reg-modal">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {successData ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                {successData.isPaid ? 'Payment & Enrollment Confirmed' : 'Free Registration Confirmed'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Registration Successful! Download the Official Competition Book below.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Your examination seat has been officially reserved for <span className="font-semibold text-slate-900">{competition.title}</span>.
              </p>
            </div>

            {/* Candidate Roll Credentials Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Candidate Name</span>
                  <div className="text-sm font-bold text-slate-900">{successData.candidateName}</div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Participant Roll Number</span>
                  <div className="text-sm font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-block">
                    {successData.participantId}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-700">Category:</span> {competition.categoryLabel || competition.category}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Competition Date:</span> {competition.competitionDate || 'Scheduled Online'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Participation Type:</span> {successData.isPaid ? `Paid Assessment (₹${successData.amount})` : 'Free Institutional Entry'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Status:</span> Confirmed & Proctored Seat Assigned
                </div>
              </div>
            </div>

            {/* OFFICIAL PDF / BOOK DOWNLOAD SECTION */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 text-left space-y-4 shadow-sm">
              <div className="flex items-center space-x-2.5 text-amber-950">
                <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Official Prescribed Competition Book & Study Material</h3>
                  <p className="text-xs text-slate-600">
                    {successData.bookTitle ? `Title: ${successData.bookTitle}` : (competition.bookDetails?.bookTitle || competition.title)}
                    {successData.bookAuthor ? ` • Author: ${successData.bookAuthor}` : (competition.bookDetails?.author ? ` • Author: ${competition.bookDetails.author}` : '')}
                  </p>
                </div>
              </div>

              {successData.requiredChapters && (
                <div className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-950">Curriculum Scope: </span>
                  {successData.requiredChapters}
                </div>
              )}

              {/* Prominent Download Button */}
              <div className="space-y-2 pt-1">
                {(successData.bookMaterialUrl || competition.pdfReadingMaterialUrl || competition.bookDetails?.pdfReadingMaterialUrl || successData.bookExternalUrl || competition.pdfExternalUrl || competition.bookDetails?.pdfExternalUrl) ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadOfficialBook}
                      disabled={isDownloadingBook}
                      className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isDownloadingBook ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Downloading Official PDF Book...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download Official PDF / Book</span>
                        </>
                      )}
                    </button>

                    {successData.bookExternalUrl && (
                      <a
                        href={successData.bookExternalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Online Reader URL</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-xs text-amber-900 font-medium">
                    Official competition study material and curriculum book is being prepared by the Examination Board. It will also be accessible from your Student Dashboard.
                  </div>
                )}

                {downloadBookError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{downloadBookError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadOfficialBook}
                      className="text-rose-700 hover:text-rose-950 underline font-bold text-xs"
                    >
                      Retry Download
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                Return to Examination Center
              </button>
            </div>
          </div>
        ) : !currentUser ? (
          /* MANDATORY AUTHENTICATION GUARD */
          <div>
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Authentication Required to Apply</h3>
                  <p className="text-xs text-slate-400">FET India Examination Bureau & Verification Guard</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-200">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">
                  Sign In or Register to Submit Application
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Under FET India Academic Regulations, all candidates must possess an authenticated account before applying for <strong className="text-slate-900">{competition.title}</strong>. This ensures verified participant rolls, secure proctored testing access, and official scorecard issuance.
                </p>
              </div>

              {/* Target Competition Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {competition.categoryLabel || competition.category}
                  </span>
                  <span className="font-mono text-slate-500">{competition.code}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{competition.title}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200">
                  <div>Assessment Date: <strong className="text-slate-800">{competition.competitionDate}</strong></div>
                  <div>Registration Fee: <strong className="text-slate-800">{competition.isPaid ? `₹${competition.participationFee}` : 'Free'}</strong></div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Sign In / Register to Apply
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel / Return
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Enroll in Competition / Examination</h3>
                  <p className="text-xs text-slate-400">Candidate Eligibility Verification & Entry Form</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Public Visitor Notice */}
        {!currentUser && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-2 px-6">
            <span>You are viewing this as a guest. Please sign in or register to submit your application.</span>
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
              >
                Sign In / Register
              </button>
            )}
          </div>
        )}

        {/* Competition Context Banner */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              {competition.categoryLabel || competition.category}
            </span>
            <h4 className="text-sm font-extrabold text-slate-900">{competition.title}</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>Date: <strong>{competition.competitionDate}</strong></span>
              <span>Total Marks: <strong>{competition.maxMarks}</strong></span>
              <span>Passing Marks: <strong>{competition.passingMarks}</strong></span>
            </div>
          </div>
        </div>

        {/* Closed/Full Warnings */}
        {isRegistrationClosed && (
          <div className="m-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Registration for this competition closed on {competition.registrationEndDate}.</span>
          </div>
        )}

        {isCapacityFull && (
          <div className="m-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Maximum seat capacity ({competition.maxParticipants}) has been reached for this competition.</span>
          </div>
        )}

        {errorMsg && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Candidate Full Legal Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.participantName}
                  onChange={(e) => setFormData({ ...formData, participantName: e.target.value })}
                  placeholder="e.g. Mohammed Zeeshan Ansari"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Parent / Guardian Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Father / Guardian Name
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="e.g. Tariq Ansari"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Mobile / WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile / WhatsApp Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+91 98200 12345"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="candidate@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* School / Institution */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                School / College / Institution Name *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.schoolInstitution}
                  onChange={(e) => setFormData({ ...formData, schoolInstitution: e.target.value })}
                  placeholder="e.g. Anjuman-I-Islam High School, CST, Mumbai"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Class / Standard Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Class / Grade Level *
              </label>
              <select
                value={formData.classGrade}
                onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {competition.eligibleClasses.map((cls, idx) => (
                  <option key={idx} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* State & District */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                District & State *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={`${formData.district}, ${formData.state}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(',');
                    setFormData({
                      ...formData,
                      district: parts[0]?.trim() || formData.district,
                      state: parts[1]?.trim() || formData.state
                    });
                  }}
                  placeholder="District, State (e.g. Mumbai, Maharashtra)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

          </div>

          {/* Fee & Payment Notice */}
          <div className="pt-2 border-t border-slate-200">
            {competition.isPaid && (competition.participationFee ?? 0) > 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-950 font-bold">
                  <CreditCard className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span>Official Participation Fee: </span>
                    <span className="text-sm font-black text-amber-900">₹{competition.participationFee}</span>
                    <span className="block text-[10px] text-amber-700 font-normal">Processed securely via Razorpay (UPI, Cards, NetBanking)</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shrink-0">
                  Paid Entry
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Free Participation • Sponsored by Fatimyah Educational Trust</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900">
                  100% Free
                </span>
              </div>
            )}
          </div>

          {/* Guidelines Confirmation Checkbox */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={formData.agreeRules}
                onChange={(e) => setFormData({ ...formData, agreeRules: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
              />
              <span>
                I confirm that the academic and personal details provided are accurate. I agree to abide by the official rules and honor code of the Fatimyah Educational Trust Competition & Examination Board.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isRegistrationClosed || isCapacityFull}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>{competition.isPaid ? 'Launching Payment...' : 'Registering Candidate...'}</span>
              ) : (
                <>
                  <span>
                    {competition.isPaid && (competition.participationFee ?? 0) > 0
                      ? `Pay ₹${competition.participationFee} & Enroll`
                      : 'Complete Free Enrollment'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
          </>
        )}

      </div>
    </div>
  );
};
