/**
 * @license
 * Competition & Examination Registration Modal
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { Competition, CompetitionRegistration } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { db, cleanFirestoreData } from '../../lib/firebase';
import { doc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

    try {
      // Generate Unique Participant Roll ID
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const participantId = `FET-PRT-${new Date().getFullYear()}-${randomSuffix}`;
      const registrationDocId = `reg-${competition.id || 'cmp'}-${currentUser.uid}`;

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

        registeredAt: new Date().toISOString(),
        status: 'registered',
        examAttemptStatus: 'not_started',
        totalMarks: competition.maxMarks,
        isResultPublished: false,
        certificateIssued: false,
        updatedAt: new Date().toISOString()
      };

      // Write to Firestore
      await setDoc(doc(db, 'competition_registrations', registrationDocId), cleanFirestoreData(newRegistration));

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
        message: `You have successfully enrolled in ${competition.title}. Your assigned Participant Roll ID is ${participantId}.`,
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
        details: `Registered candidate ${formData.participantName} for ${competition.title} with Participant ID ${participantId}`,
        timestamp: new Date().toISOString()
      })).catch(() => {});

      onSuccess(registrationDocId);
    } catch (err: any) {
      console.error('Error submitting competition registration:', err);
      setErrorMsg(err?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" id="fet-competition-reg-modal">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        
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
                <span>Registering Candidate...</span>
              ) : (
                <>
                  <span>Complete Enrollment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
