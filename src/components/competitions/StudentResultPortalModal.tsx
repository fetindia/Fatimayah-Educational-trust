/**
 * @license
 * Student Examination Result & Scorecard Portal Modal
 * Fatimyah Educational Trust India (FET India)
 * Part 5: Candidate Result Self-Lookup & Scorecard Generation
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Clock, 
  Calendar, 
  Download, 
  FileText, 
  Check, 
  XCircle, 
  HelpCircle,
  Trophy,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  User,
  School
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CompetitionRegistration, CompetitionCertificateRecord, Competition } from '../../types';
import { DigitalCertificateModal } from './DigitalCertificateModal';

interface StudentResultPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillRollNumber?: string;
}

export const StudentResultPortalModal: React.FC<StudentResultPortalModalProps> = ({
  isOpen,
  onClose,
  prefillRollNumber = ''
}) => {
  const { currentUser, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState(prefillRollNumber);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<CompetitionRegistration | null>(null);
  const [userResultsList, setUserResultsList] = useState<CompetitionRegistration[]>([]);
  const [isLoadingUserResults, setIsLoadingUserResults] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<CompetitionCertificateRecord | null>(null);

  // If user is authenticated, fetch their exam registrations automatically
  useEffect(() => {
    if (!isOpen) return;

    if (currentUser?.uid) {
      setIsLoadingUserResults(true);
      const fetchMyResults = async () => {
        try {
          const q = query(
            collection(db, 'competition_registrations'),
            where('participantUid', '==', currentUser.uid)
          );
          const snap = await getDocs(q);
          const list: CompetitionRegistration[] = [];
          snap.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as CompetitionRegistration);
          });
          setUserResultsList(list);
          if (list.length > 0 && !selectedResult) {
            // Select the most recent one by default
            setSelectedResult(list[0]);
          }
        } catch (err) {
          console.warn('Could not auto-fetch user results:', err);
        } finally {
          setIsLoadingUserResults(false);
        }
      };
      fetchMyResults();
    }
  }, [isOpen, currentUser?.uid]);

  // Execute Search by Roll ID / Registration ID / Email
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryStr = searchTerm.trim();
    if (!queryStr) {
      setErrorMessage('Please enter a Participant Roll ID, Registration ID, or Registered Email.');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      // 1. Try participantId
      let q = query(
        collection(db, 'competition_registrations'),
        where('participantId', '==', queryStr)
      );
      let snap = await getDocs(q);

      // 2. Try registrationId / docId if not found
      if (snap.empty) {
        q = query(
          collection(db, 'competition_registrations'),
          where('registrationId', '==', queryStr)
        );
        snap = await getDocs(q);
      }

      // 3. Try direct doc get
      if (snap.empty) {
        const docRef = doc(db, 'competition_registrations', queryStr);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSelectedResult({ id: docSnap.id, ...docSnap.data() } as CompetitionRegistration);
          setIsSearching(false);
          return;
        }
      }

      // 4. Try email
      if (snap.empty) {
        q = query(
          collection(db, 'competition_registrations'),
          where('email', '==', queryStr)
        );
        snap = await getDocs(q);
      }

      if (!snap.empty) {
        const docs: CompetitionRegistration[] = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() } as CompetitionRegistration));
        setSelectedResult(docs[0]);
      } else {
        setErrorMessage(`No candidate registration found matching "${queryStr}". Please verify your Roll ID.`);
      }
    } catch (err: any) {
      console.error('Error querying student result:', err);
      setErrorMessage('An error occurred while fetching candidate results. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Generate certificate data on the fly for viewing
  const handleViewCertificate = (reg: CompetitionRegistration) => {
    const certId = `FET-CERT-CMP-2026-${reg.participantId ? reg.participantId.slice(-4) : 'PASS'}`;
    const certRecord: CompetitionCertificateRecord = {
      certificateId: certId,
      participantId: reg.participantId || 'FET-PRT-2026',
      registrationId: reg.registrationId || reg.id || 'reg',
      competitionId: reg.competitionId || 'cmp',
      competitionTitle: reg.competitionTitle || 'National Academic Examination',
      competitionCategory: reg.competitionCategory || 'book_reading',
      participantName: reg.participantName,
      parentName: reg.parentName,
      schoolInstitution: reg.schoolInstitution,
      district: reg.district,
      state: reg.state,
      achievement: reg.awardCategory || (reg.rank && reg.rank <= 3 ? (reg.rank === 1 ? '1st_rank' : reg.rank === 2 ? '2nd_rank' : '3rd_rank') : 'participation'),
      achievementTitle: reg.rank === 1 
        ? 'National 1st Rank Distinction' 
        : (reg.awardCategory === 'merit' || (reg.percentage ?? 0) >= 70 ? 'Certificate of Merit & Excellence' : 'Certificate of Participation'),
      rank: reg.rank,
      score: reg.marksObtained ?? 0,
      totalMarks: reg.totalMarks ?? 100,
      grade: reg.grade || 'Pass',
      status: 'valid',
      isVerified: true,
      trustName: 'Fatimyah Educational Trust',
      issueDate: reg.evaluatedAt || reg.submittedAt || new Date().toISOString(),
      issuedByUid: 'fet-exam-directorate',
      issuedByEmail: 'directorate@fetindia.com',
      createdAt: reg.evaluatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setActiveCertificate(certRecord);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto" id="fet-student-result-portal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full my-auto overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-700/80 text-emerald-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Student Examination Result Portal</h3>
              <p className="text-[11px] text-slate-300">Fatimyah Educational Trust • Academic Board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Search Roll Number Form */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Search by Candidate Roll Number, Registration ID, or Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. FET-PRT-2026-XXXX or student@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                {isSearching ? <span>Searching...</span> : <span>Lookup Result</span>}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>

          {/* Authenticated User Registration Quick Select */}
          {userResultsList.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Your Registered Enrolled Examinations ({userResultsList.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {userResultsList.map((r) => (
                  <button
                    key={r.id || r.registrationId}
                    type="button"
                    onClick={() => {
                      setSelectedResult(r);
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-left ${
                      selectedResult?.registrationId === r.registrationId || selectedResult?.id === r.id
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span className="block font-semibold truncate max-w-[240px]">{r.competitionTitle}</span>
                    <span className="text-[10px] opacity-80 block font-mono">{r.participantId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scorecard Display */}
          {selectedResult ? (
            <div className="space-y-4">
              
              {/* Header Details Card */}
              <div className="p-5 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white space-y-4 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 inline-block mb-1">
                      {selectedResult.competitionCategory?.replace('_', ' ') || 'Examination'}
                    </span>
                    <h4 className="text-base font-black text-white">{selectedResult.competitionTitle}</h4>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Roll ID: {selectedResult.participantId} • Ref: {selectedResult.registrationId}
                    </p>
                  </div>

                  <div className="text-right sm:self-start">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide inline-block ${
                      selectedResult.marksObtained !== undefined && (selectedResult.marksObtained >= 40 || selectedResult.status === 'completed')
                        ? 'bg-emerald-500 text-slate-950'
                        : selectedResult.status === 'registered' || selectedResult.examAttemptStatus === 'not_started'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-700 text-slate-200'
                    }`}>
                      {selectedResult.examAttemptStatus === 'not_started'
                        ? 'Enrolled (Not Attempted)'
                        : selectedResult.isResultPublished || selectedResult.marksObtained !== undefined
                        ? (selectedResult.grade || 'Result Verified')
                        : 'Under Verification'}
                    </span>
                  </div>
                </div>

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Candidate Name</span>
                    <span className="font-bold text-white text-sm">{selectedResult.participantName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Parent / Guardian</span>
                    <span className="font-bold text-slate-200">{selectedResult.parentName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Class / Grade</span>
                    <span className="font-bold text-slate-200">{selectedResult.classGrade || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Institution</span>
                    <span className="font-bold text-slate-200 truncate block">{selectedResult.schoolInstitution || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Assessment Score Grid */}
              {selectedResult.marksObtained !== undefined ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Score Obtained</span>
                    <div className="text-2xl font-black text-emerald-900">
                      {selectedResult.marksObtained}
                      <span className="text-xs font-normal text-emerald-700"> / {selectedResult.totalMarks || 100}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-1">
                    <span className="text-[11px] font-bold text-blue-800 uppercase block">Percentage</span>
                    <div className="text-2xl font-black text-blue-900">
                      {selectedResult.percentage ?? Number(((selectedResult.marksObtained / (selectedResult.totalMarks || 100)) * 100).toFixed(1))}%
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-1">
                    <span className="text-[11px] font-bold text-purple-800 uppercase block">Academic Grade</span>
                    <div className="text-lg font-black text-purple-900 truncate">
                      {selectedResult.grade || 'Passed'}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase block">Merit Standing</span>
                    <div className="text-lg font-black text-amber-900">
                      {selectedResult.rank ? `#${selectedResult.rank} Rank` : (selectedResult.awardCategory === 'merit' ? 'Distinction' : 'Certified')}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                  <h5 className="font-bold text-slate-800 text-sm">Examination Awaiting Attempt or Evaluation</h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    This candidate is officially registered. If the examination was recently completed, the Directorate is finalizing score sheet verification.
                  </p>
                </div>
              )}

              {/* Detailed Breakdown */}
              {(selectedResult.correctAnswersCount !== undefined || selectedResult.evaluatorRemarks) && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Evaluation Breakdown & Evaluator Remarks</span>
                  </h5>

                  {selectedResult.correctAnswersCount !== undefined && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 font-bold">
                        <span className="block text-[10px] text-emerald-700 uppercase">Correct</span>
                        <span className="text-base">{selectedResult.correctAnswersCount}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 font-bold">
                        <span className="block text-[10px] text-rose-700 uppercase">Incorrect</span>
                        <span className="text-base">{selectedResult.incorrectAnswersCount || 0}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                        <span className="block text-[10px] text-slate-500 uppercase">Unanswered</span>
                        <span className="text-base">{selectedResult.unansweredCount || 0}</span>
                      </div>
                    </div>
                  )}

                  {selectedResult.evaluatorRemarks && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      "{selectedResult.evaluatorRemarks}"
                    </p>
                  )}
                </div>
              )}

              {/* Certificate Actions */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-950 text-xs block">Official Digital Certificate</span>
                    <span className="text-[11px] text-indigo-800">
                      Cryptographically verifiable with official QR code and seal of Fatimyah Educational Trust.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleViewCertificate(selectedResult)}
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>View & Download Certificate</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Enter your Roll ID or Registration ID above to inspect your scorecard.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All scores and certificates verified by the Central Examination Board.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Sub-modal: Digital Certificate */}
      {activeCertificate && (
        <DigitalCertificateModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}
    </div>
  );
};
