/**
 * @license
 * Dynamic Candidate Watermark & Visual Anti-Cheating Overlay
 * Fatimyah Educational Trust India (FET India)
 *
 * Implements continuous candidate identity stamping across the active examination
 * surface. If an external camera or phone is used to photograph the screen,
 * the candidate's verified name, roll number, registration ID, and live timestamp
 * are indelibly captured on every frame.
 */

import React, { useEffect, useState } from 'react';

interface ExamIntegrityWatermarkProps {
  candidateName: string;
  registrationNumber: string;
  participantId?: string;
  competitionTitle: string;
}

export const ExamIntegrityWatermark: React.FC<ExamIntegrityWatermarkProps> = ({
  candidateName,
  registrationNumber,
  participantId,
  competitionTitle
}) => {
  const [liveTimestamp, setLiveTimestamp] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour12: false })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimestamp(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const watermarkString = `FET INDIA PROCTORED • ${candidateName.toUpperCase()} • ROLL: ${registrationNumber} • ${participantId || ''} • ${liveTimestamp}`;

  return (
    <>
      {/* 1. Global Print-Lockdown Injected CSS */}
      <style>{`
        @media print {
          html, body, div, canvas, section, header, main, aside, table {
            display: none !important;
            visibility: hidden !important;
          }
          body::after {
            content: "PRINTING IS STRICTLY PROHIBITED DURING ACTIVE FET INDIA EXAMINATIONS.";
            display: block !important;
            visibility: visible !important;
            font-size: 24pt;
            color: red;
            text-align: center;
            padding-top: 50px;
          }
        }
      `}</style>

      {/* 2. Full-Screen Repeating Diagonal Watermark Grid */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none select-none z-30 overflow-hidden flex flex-col justify-around opacity-[0.06] rotate-[-22deg] scale-125"
      >
        {Array.from({ length: 12 }).map((_, rIdx) => (
          <div key={rIdx} className="whitespace-nowrap flex space-x-16 font-mono text-[11px] sm:text-xs font-black tracking-widest text-white">
            {Array.from({ length: 8 }).map((_, cIdx) => (
              <span key={cIdx} className="inline-block transform">
                {watermarkString}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* 3. Discrete Corner Stamped Badge */}
      <div 
        aria-hidden="true"
        className="fixed bottom-2 right-3 z-30 pointer-events-none select-none opacity-30 text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/40"
      >
        Candidate: {candidateName} | Roll: {registrationNumber} | {liveTimestamp}
      </div>
    </>
  );
};
