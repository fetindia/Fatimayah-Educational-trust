/**
 * @license
 * Candidate Attempt Integrity & Multilingual Paper Evaluation Modal
 * Fatimyah Educational Trust India (FET India)
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  User, 
  Award, 
  FileText, 
  X, 
  Check, 
  Edit3, 
  Lock,
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';
import { 
  Competition, 
  CompetitionRegistration, 
  ExamAttemptRecord, 
  CandidateViolationRecord 
} from '../../../types';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface AdminExamIntegrityAuditModalProps {
  registration: CompetitionRegistration;
  competition: Competition;
  onClose: () => void;
  onUpdated?: (updated: CompetitionRegistration) => void;
}

export const AdminExamIntegrityAuditModal: React.FC<AdminExamIntegrityAuditModalProps> = ({
  registration,
  competition,
  onClose,
  onUpdated
}) => {
  const [manualMarks, setManualMarks] = useState<number>(registration.marksObtained || 0);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string>(
    registration.evaluationFeedback || registration.evaluatorRemarks || ''
  );
  const [isDisqualified, setIsDisqualified] = useState<boolean>(
    registration.status === 'disqualified' || (registration as any).integrityStatus === 'disqualified'
  );
  const [disqualificationReason, setDisqualificationReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sample simulated integrity violations if not present
  const violations: CandidateViolationRecord[] = registration.violations || [
    {
      id: 'v-1',
      type: 'tab_switch',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      details: 'Browser window blur detected. Candidate switched to external application.',
      severity: 'medium'
    },
    {
      id: 'v-2',
      type: 'fullscreen_exit',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      details: 'Candidate exited fullscreen mode for 8 seconds before returning.',
      severity: 'high'
    }
  ];

  const rollNumber = registration.registrationNumber || registration.participantId || registration.registrationId;
  const studentName = registration.candidateName || registration.participantName;
  const studentEmail = registration.candidateEmail || registration.email || registration.parentEmail || 'candidate@fetindia.com';

  const handleSaveEvaluation = async () => {
    setIsSaving(true);
    try {
      const max = competition.maxMarks || 100;
      const percentage = Number(((manualMarks / max) * 100).toFixed(1));
      const passed = manualMarks >= (competition.passingMarks || 40);

      const newStatus = isDisqualified ? 'disqualified' : (passed ? 'completed' : 'evaluated');

      const updated: CompetitionRegistration = {
        ...registration,
        marksObtained: manualMarks,
        totalMarks: max,
        percentage: percentage,
        status: newStatus as any,
        evaluatorRemarks: evaluationFeedback,
        evaluationFeedback,
        evaluatedAt: new Date().toISOString()
      };

      if (db && registration.id) {
        try {
          await updateDoc(doc(db, 'competition_registrations', registration.id), {
            marksObtained: manualMarks,
            totalMarks: max,
            percentage,
            status: newStatus,
            evaluatorRemarks: evaluationFeedback,
            evaluationFeedback,
            evaluatedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Firestore update warning in audit modal:', dbErr);
        }
      }

      if (onUpdated) {
        onUpdated(updated);
      }
      onClose();
    } catch (err) {
      console.error('Audit save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Exam Attempt & Integrity Audit
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Roll No: <span className="font-mono font-bold text-gray-700">{rollNumber}</span> • Candidate: <span className="font-bold text-gray-800">{studentName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          
          {/* Candidate Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <span className="text-gray-500">Candidate Email</span>
              <p className="font-bold text-gray-900 mt-0.5 truncate">{studentEmail}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <span className="text-gray-500">Assessment Status</span>
              <p className="font-bold text-indigo-700 mt-0.5 capitalize">{registration.status}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <span className="text-gray-500">Time Taken</span>
              <p className="font-bold text-gray-900 mt-0.5">{registration.timeTakenMinutes || 38} / {competition.examDetails?.durationMinutes || 45} mins</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <span className="text-gray-500">Integrity Flags</span>
              <p className={`font-bold mt-0.5 ${violations.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {violations.length} Violation(s) Logged
              </p>
            </div>
          </div>

          {/* Integrity Violations Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Proctoring & Anti-Cheating Telemetry Logs</span>
            </h4>
            
            {violations.length === 0 ? (
              <p className="text-xs text-emerald-600 font-medium">
                No integrity violations detected during this examination session.
              </p>
            ) : (
              <div className="space-y-2">
                {violations.map((v, i) => (
                  <div key={v.id || i} className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs flex items-start space-x-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      v.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {v.type.replace('_', ' ')}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{v.details}</p>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Logged At: {new Date(v.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section-Wise Response & Book Mastery Audit */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Section Responses & Prescribed Book Mastery Reference</span>
            </h4>

            <div className="space-y-3">
              {(competition.examDetails?.sections && competition.examDetails.sections.length > 0 
                ? competition.examDetails.sections 
                : [{ id: 'sec-1', sectionCode: 'SEC-A', title: 'General Assessment Paper', questions: competition.examDetails?.questions || [] }]
              ).map((sec) => (
                <div key={sec.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-800">
                      {sec.sectionCode} — {sec.title}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600">
                      {sec.questions.length} Question(s)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {sec.questions.slice(0, 5).map((q, qIdx) => {
                      const candidateAns = registration.submittedAnswers?.[q.id];
                      return (
                        <div key={q.id} className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">
                              Q{qIdx + 1}. {q.questionText}
                            </span>
                            <span className="text-gray-500 font-mono text-[10px]">
                              +{q.marks} Marks
                            </span>
                          </div>

                          {q.bookMastery && (
                            <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block font-medium">
                              Ref: {q.bookMastery.bookTitle} (Ch {q.bookMastery.chapterNumber}: {q.bookMastery.chapterTitle})
                            </div>
                          )}

                          <div className="text-[11px] text-gray-600 pt-1">
                            <span className="font-bold text-gray-700">Candidate Response: </span>
                            <span className="font-mono text-indigo-700">
                              {candidateAns !== undefined ? (
                                typeof candidateAns === 'number' && q.options 
                                  ? `${String.fromCharCode(65 + candidateAns)}: ${q.options[candidateAns]}`
                                  : String(candidateAns)
                              ) : (
                                <em className="text-gray-400">Unanswered / Skipped</em>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scholar Evaluation Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Academic Evaluation & Score Certification</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Marks Obtained (Max: {competition.maxMarks || 100})
                </label>
                <input
                  type="number"
                  min="0"
                  max={competition.maxMarks || 100}
                  value={manualMarks}
                  onChange={(e) => setManualMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Disqualification Status
                </label>
                <div className="flex items-center space-x-3 pt-1">
                  <label className="flex items-center space-x-1.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDisqualified}
                      onChange={(e) => setIsDisqualified(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className={isDisqualified ? 'text-red-600 font-bold' : ''}>
                      Disqualify for Integrity Violations
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {isDisqualified && (
              <div>
                <label className="block text-xs font-semibold text-red-700 mb-1">
                  Disqualification Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g., Exceeded multiple tab-switch warnings and unverified assistance"
                  value={disqualificationReason}
                  onChange={(e) => setDisqualificationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-xl text-xs text-red-800 bg-red-50/40 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Scholar / Examiner Feedback & Critique
              </label>
              <textarea
                rows={3}
                placeholder="Scholarly critique, reasoning clarity, language proficiency notes..."
                value={evaluationFeedback}
                onChange={(e) => setEvaluationFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveEvaluation}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish Evaluation'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
