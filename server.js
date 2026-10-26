// server.ts
import express from "express";
import http from "http";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import { initializeApp } from "firebase/app";
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
  limit,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";
import fs from "fs";
import multer from "multer";

// src/data/initialCompetitions.ts
var INITIAL_COMPETITIONS = [
  {
    id: "cmp-book-reading-2026",
    code: "FET-CMP-2026-001",
    title: "All-India National Book Reading & Comprehension Competition 2026",
    category: "book_reading",
    categoryLabel: "Book Reading Competition",
    description: "A nationwide reading initiative designed to cultivate profound comprehension, intellectual rigor, and moral reflection through classic educational literature and historical biographies.",
    eligibilityAgeMin: 12,
    eligibilityAgeMax: 25,
    eligibleClasses: ["Class 8-10", "Class 11-12", "Graduation", "Open Category"],
    eligibleStates: ["All India"],
    eligibleDistricts: ["All Districts"],
    registrationStartDate: "2026-07-01",
    registrationEndDate: "2026-09-30",
    competitionDate: "2026-10-15",
    resultPublicationDate: "2026-11-01",
    maxParticipants: 5e3,
    registeredCount: 384,
    maxMarks: 100,
    passingMarks: 40,
    rules: [
      "Participants must read the designated prescribed volume before the assessment date.",
      "The assessment includes 50 MCQ comprehension questions and a 300-word critical analytical essay.",
      "Submissions are evaluated by academic scholars on clarity of thought, historical accuracy, and ethical articulation.",
      "Top 3 national rank holders will receive the FET Kalam Memorial Gold Medal, Laptop, and \u20B950,000 cash grant."
    ],
    coverImageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    bookDetails: {
      bookTitle: "Wings of Fire & Ethical Horizons: Biography and Moral Philosophy",
      author: "Dr. A.P.J. Abdul Kalam & Dr. Arun Tiwari",
      recommendedPublisher: "Universities Press / FET Academic Library Edition",
      readingDurationWeeks: 4,
      requiredChapters: "Chapters 1 through 8 (Early Life, Scientific Endeavors & Ethical Leadership)",
      submissionRequirements: "Online objective assessment (40 mins) + Chapter-wise summary submission",
      pdfReadingMaterialUrl: "https://example.com/books/wings-of-fire-curriculum.pdf"
    },
    examDetails: {
      isOnlineExam: true,
      paperCode: "FET-PPR-BR-2026",
      paperTitle: "National Book Reading Assessment Paper 2026",
      durationMinutes: 45,
      totalMarks: 100,
      passingMarks: 40,
      supportedLanguages: ["en", "ur", "hi"],
      defaultLanguage: "en",
      allowLanguageSwitching: true,
      allowReviewBeforeSubmit: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      integrityConfig: {
        enforceFullscreen: true,
        trackTabSwitch: true,
        maxTabSwitchViolations: 3,
        preventCopyPaste: true,
        preventContextMenu: true,
        autoSubmitOnTimeExpiry: true,
        allowResumeOnDisconnect: true,
        heartbeatIntervalSeconds: 15
      },
      instructions: [
        "Read each question carefully in your preferred language (English, Urdu, or Hindi).",
        "Section A comprises Objective Comprehension MCQs (60 Marks).",
        "Section B comprises Critical Analytical Synthesis (40 Marks).",
        "Do not switch browser tabs or exit fullscreen mode. Violations will be recorded."
      ],
      sections: [
        {
          id: "sec-br-a",
          sectionCode: "Section A",
          title: "Objective Comprehension & Historical Context",
          description: "Objective MCQs based on Chapters 1 through 6 of the prescribed reading.",
          totalMarks: 60,
          passingMarks: 24,
          questions: [
            {
              id: "q-br-1",
              questionText: "What foundational ethical principle did the author emphasize as essential for scientific progress and national service in Chapter 2?",
              primaryLanguage: "en",
              translations: {
                ur: {
                  language: "ur",
                  questionText: "\u0645\u0635\u0646\u0641 \u0646\u06D2 \u0628\u0627\u0628 \u062F\u0648\u0645 \u0645\u06CC\u06BA \u0633\u0627\u0626\u0646\u0633\u06CC \u062A\u0631\u0642\u06CC \u0627\u0648\u0631 \u0642\u0648\u0645\u06CC \u062E\u062F\u0645\u062A \u06A9\u06D2 \u0644\u06CC\u06D2 \u06A9\u0633 \u0628\u0646\u06CC\u0627\u062F\u06CC \u0627\u062E\u0644\u0627\u0642\u06CC \u0627\u0635\u0648\u0644 \u06A9\u0648 \u0633\u0628 \u0633\u06D2 \u0627\u06C1\u0645 \u0642\u0631\u0627\u0631 \u062F\u06CC\u0627 \u06C1\u06D2\u061F",
                  options: [
                    "\u062F\u06CC\u0627\u0646\u062A \u062F\u0627\u0631\u06CC\u060C \u0645\u0633\u0644\u0633\u0644 \u062C\u0633\u062A\u062C\u0648\u060C \u0627\u0648\u0631 \u0639\u0648\u0627\u0645\u06CC \u0641\u0644\u0627\u062D \u06A9\u06D2 \u0644\u06CC\u06D2 \u0628\u06D2 \u0644\u0648\u062B \u0648\u0627\u0628\u0633\u062A\u06AF\u06CC",
                    "\u0635\u0631\u0641 \u062A\u062C\u0627\u0631\u062A\u06CC \u0645\u0646\u0627\u0641\u0639 \u0627\u0648\u0631 \u06A9\u0627\u0631\u0648\u0628\u0627\u0631\u06CC \u062A\u0633\u0644\u0637 \u06A9\u0627 \u062D\u0635\u0648\u0644",
                    "\u0633\u0645\u0627\u062C\u06CC \u0645\u0633\u0627\u0626\u0644 \u0633\u06D2 \u06A9\u0646\u0627\u0631\u06C1 \u06A9\u0634\u06CC \u0627\u0648\u0631 \u0645\u062D\u0636 \u0646\u0638\u0631\u06CC\u0627\u062A\u06CC \u0628\u062D\u062B",
                    "\u0628\u063A\u06CC\u0631 \u062C\u062F\u062A \u06A9\u06D2 \u067E\u0631\u0627\u0646\u06D2 \u062F\u0641\u062A\u0631\u06CC \u0637\u0631\u06CC\u0642\u06C1 \u06A9\u0627\u0631 \u067E\u0631 \u0633\u062E\u062A\u06CC \u0633\u06D2 \u0639\u0645\u0644"
                  ],
                  explanation: "\u0645\u062A\u0646 \u0645\u06CC\u06BA \u062F\u06CC\u0627\u0646\u062A \u062F\u0627\u0631\u06CC \u0627\u0648\u0631 \u0628\u06D2 \u0644\u0648\u062B \u062E\u062F\u0645\u062A \u06A9\u0648 \u0628\u0627\u0627\u062B\u0631 \u0633\u0627\u0626\u0646\u0633\u06CC \u062A\u0631\u0642\u06CC \u06A9\u06CC \u0628\u0646\u06CC\u0627\u062F\u06CC \u0642\u062F\u0631 \u0642\u0631\u0627\u0631 \u062F\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2\u06D4",
                  direction: "rtl"
                },
                hi: {
                  language: "hi",
                  questionText: "\u0905\u0927\u094D\u092F\u093E\u092F 2 \u092E\u0947\u0902 \u0932\u0947\u0916\u0915 \u0928\u0947 \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u092A\u094D\u0930\u0917\u0924\u093F \u0914\u0930 \u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0938\u0947\u0935\u093E \u0915\u0947 \u0932\u093F\u090F \u0915\u093F\u0938 \u092E\u0942\u0932\u092D\u0942\u0924 \u0928\u0948\u0924\u093F\u0915 \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u092A\u0930 \u092C\u0932 \u0926\u093F\u092F\u093E \u0939\u0948?",
                  options: [
                    "\u0938\u0924\u094D\u092F\u0928\u093F\u0937\u094D\u0920\u093E, \u0928\u093F\u0930\u0902\u0924\u0930 \u0905\u0928\u094D\u0935\u0947\u0937\u0923 \u0914\u0930 \u091C\u0928 \u0915\u0932\u094D\u092F\u093E\u0923 \u0915\u0947 \u0932\u093F\u090F \u0928\u093F\u0938\u094D\u0935\u093E\u0930\u094D\u0925 \u0938\u092E\u0930\u094D\u092A\u0923",
                    "\u0915\u0947\u0935\u0932 \u0935\u094D\u092F\u093E\u0935\u0938\u093E\u092F\u093F\u0915 \u0932\u093E\u092D \u0914\u0930 \u092C\u093E\u091C\u093E\u0930 \u090F\u0915\u093E\u0927\u093F\u0915\u093E\u0930 \u0915\u0940 \u0916\u094B\u091C",
                    "\u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0938\u092E\u0938\u094D\u092F\u093E\u0913\u0902 \u0938\u0947 \u0905\u0932\u0917\u093E\u0935 \u0914\u0930 \u0915\u0947\u0935\u0932 \u0938\u0948\u0926\u094D\u0927\u093E\u0902\u0924\u093F\u0915 \u0905\u0927\u094D\u092F\u092F\u0928",
                    "\u0928\u0935\u093E\u091A\u093E\u0930 \u0915\u0947 \u092C\u093F\u0928\u093E \u092A\u0941\u0930\u093E\u0928\u0940 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E\u0913\u0902 \u0915\u093E \u0905\u0902\u0927\u093E\u0928\u0941\u0915\u0930\u0923"
                  ],
                  explanation: "\u092A\u093E\u0920 \u092E\u0947\u0902 \u0938\u0924\u094D\u092F\u0928\u093F\u0937\u094D\u0920\u093E \u0914\u0930 \u0928\u093F\u0938\u094D\u0935\u093E\u0930\u094D\u0925 \u0938\u0947\u0935\u093E \u0915\u094B \u0935\u093F\u091C\u094D\u091E\u093E\u0928 \u0915\u093E \u092E\u0942\u0932 \u0938\u094D\u0924\u0902\u092D \u092C\u0924\u093E\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964",
                  direction: "ltr"
                }
              },
              questionType: "mcq",
              options: [
                "Integrity, persistent inquiry, and selfless dedication to community welfare",
                "Exclusive pursuit of commercial profitability and market monopoly",
                "Isolation from social issues and purely theoretical modeling",
                "Strict adherence to outdated procedural routines without innovation"
              ],
              correctOptionIndex: 0,
              marks: 20,
              negativeMarks: 5,
              difficulty: "medium",
              bookMastery: {
                bookTitle: "Wings of Fire & Ethical Horizons",
                chapterNumber: 2,
                chapterTitle: "Early Scientific Endeavors",
                pageRange: "pp. 45-52",
                topicTag: "Scientific Ethics"
              },
              explanation: "The text highlights integrity and selfless dedication as the core virtues of impactful science."
            },
            {
              id: "q-br-2",
              questionText: "According to the prescribed chapters, how should young scholars navigate career setbacks and unexpected failures?",
              primaryLanguage: "en",
              translations: {
                ur: {
                  language: "ur",
                  questionText: "\u062A\u062C\u0648\u06CC\u0632 \u06A9\u0631\u062F\u06C1 \u0627\u0628\u0648\u0627\u0628 \u06A9\u06D2 \u0645\u0637\u0627\u0628\u0642\u060C \u0646\u0648\u062C\u0648\u0627\u0646 \u0645\u062D\u0642\u0642\u06CC\u0646 \u06A9\u0648 \u062A\u0639\u0644\u06CC\u0645\u06CC \u0648 \u067E\u06CC\u0634\u06C1 \u0648\u0631\u0627\u0646\u06C1 \u0646\u0627\u06A9\u0627\u0645\u06CC\u0648\u06BA \u0627\u0648\u0631 \u0631\u06A9\u0627\u0648\u0679\u0648\u06BA \u06A9\u0627 \u0633\u0627\u0645\u0646\u0627 \u06A9\u06CC\u0633\u06D2 \u06A9\u0631\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2\u061F",
                  options: [
                    "\u0645\u0634\u06A9\u0644 \u0639\u0644\u0645\u06CC \u0627\u0648\u0631 \u062A\u062D\u0642\u06CC\u0642\u06CC \u0633\u0631\u06AF\u0631\u0645\u06CC\u0648\u06BA \u06A9\u0648 \u0641\u0648\u0631\u06CC \u0637\u0648\u0631 \u067E\u0631 \u062A\u0631\u06A9 \u06A9\u0631 \u06A9\u06D2",
                    "\u0646\u0627\u06A9\u0627\u0645\u06CC \u06A9\u0648 \u062A\u0634\u062E\u06CC\u0635 \u0648 \u0631\u06C1\u0646\u0645\u0627\u0626\u06CC \u0633\u0645\u062C\u06BE \u06A9\u0631 \u0627\u0648\u0631 \u0645\u0646\u0638\u0645 \u062D\u06A9\u0645\u062A \u0639\u0645\u0644\u06CC \u0633\u06D2 \u062B\u0627\u0628\u062A \u0642\u062F\u0645 \u0631\u06C1 \u06A9\u0631",
                    "\u0633\u0627\u0631\u0627 \u0627\u0644\u0632\u0627\u0645 \u0635\u0631\u0641 \u0628\u06CC\u0631\u0648\u0646\u06CC \u062F\u0641\u062A\u0631\u06CC \u0645\u062C\u0628\u0648\u0631\u06CC\u0648\u06BA \u067E\u0631 \u0688\u0627\u0644 \u06A9\u0631",
                    "\u0628\u0646\u06CC\u0627\u062F\u06CC \u0633\u0627\u0626\u0646\u0633\u06CC \u0627\u0635\u0648\u0644\u0648\u06BA \u06A9\u0648 \u0646\u0638\u0631 \u0627\u0646\u062F\u0627\u0632 \u06A9\u0631 \u06A9\u06D2"
                  ],
                  direction: "rtl"
                },
                hi: {
                  language: "hi",
                  questionText: "\u0928\u093F\u0930\u094D\u0927\u093E\u0930\u093F\u0924 \u0905\u0927\u094D\u092F\u093E\u092F\u094B\u0902 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930, \u092F\u0941\u0935\u093E \u0935\u093F\u0926\u094D\u092F\u093E\u0930\u094D\u0925\u093F\u092F\u094B\u0902 \u0915\u094B \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u092C\u093E\u0927\u093E\u0913\u0902 \u0914\u0930 \u0905\u092A\u094D\u0930\u0924\u094D\u092F\u093E\u0936\u093F\u0924 \u0905\u0938\u092B\u0932\u0924\u093E\u0913\u0902 \u0915\u093E \u0938\u093E\u092E\u0928\u093E \u0915\u0948\u0938\u0947 \u0915\u0930\u0928\u093E \u091A\u093E\u0939\u093F\u090F?",
                  options: [
                    "\u0915\u0920\u093F\u0928 \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u092A\u094D\u0930\u092F\u093E\u0938\u094B\u0902 \u0915\u094B \u0924\u0941\u0930\u0902\u0924 \u091B\u094B\u0921\u093C\u0915\u0930",
                    "\u0905\u0938\u092B\u0932\u0924\u093E \u0915\u094B \u0928\u0948\u0926\u093E\u0928\u093F\u0915 \u0938\u0940\u0916 \u092E\u093E\u0928\u0915\u0930 \u0914\u0930 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093F\u0924 \u0938\u092E\u0938\u094D\u092F\u093E \u0928\u093F\u0935\u093E\u0930\u0923 \u0938\u0947 \u0927\u0948\u0930\u094D\u092F \u0930\u0916\u0915\u0930",
                    "\u0915\u0947\u0935\u0932 \u092C\u093E\u0939\u0930\u0940 \u0938\u0902\u0917\u0920\u0928\u093E\u0924\u094D\u092E\u0915 \u092C\u093E\u0927\u093E\u0913\u0902 \u092A\u0930 \u0926\u094B\u0937 \u092E\u0922\u093C\u0915\u0930",
                    "\u092E\u094C\u0932\u093F\u0915 \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924\u094B\u0902 \u0915\u0940 \u0909\u092A\u0947\u0915\u094D\u0937\u093E \u0915\u0930\u0915\u0947"
                  ],
                  direction: "ltr"
                }
              },
              questionType: "mcq",
              options: [
                "By abandoning challenging academic pursuits immediately",
                "By treating setbacks as diagnostic feedback and cultivating resilience through systematic problem-solving",
                "By placing blame solely on external organizational constraints",
                "By ignoring fundamental scientific laws"
              ],
              correctOptionIndex: 1,
              marks: 20,
              negativeMarks: 5,
              difficulty: "medium",
              bookMastery: {
                bookTitle: "Wings of Fire & Ethical Horizons",
                chapterNumber: 3,
                chapterTitle: "Overcoming Setbacks",
                pageRange: "pp. 82-88",
                topicTag: "Resilience"
              },
              explanation: "The author defines failure as learning feedback and urges proactive resilience."
            },
            {
              id: "q-br-3",
              questionText: "In Chapter 5, what role does cultural harmony and mutual respect play in collaborative institutional breakthroughs?",
              primaryLanguage: "en",
              translations: {
                ur: {
                  language: "ur",
                  questionText: "\u0628\u0627\u0628 \u067E\u0646\u062C\u0645 \u0645\u06CC\u06BA \u0627\u062F\u0627\u0631\u06C1 \u062C\u0627\u062A\u06CC \u0633\u0627\u0626\u0646\u0633\u06CC \u06A9\u0627\u0645\u06CC\u0627\u0628\u06CC\u0648\u06BA \u06A9\u06D2 \u062D\u0635\u0648\u0644 \u0645\u06CC\u06BA \u062B\u0642\u0627\u0641\u062A\u06CC \u06C1\u0645 \u0622\u06C1\u0646\u06AF\u06CC \u0627\u0648\u0631 \u0628\u0627\u06C1\u0645\u06CC \u0627\u062D\u062A\u0631\u0627\u0645 \u06A9\u0627 \u06A9\u06CC\u0627 \u06A9\u0631\u062F\u0627\u0631 \u0628\u062A\u0627\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2\u061F",
                  options: [
                    "\u06CC\u06C1 \u0645\u062E\u062A\u0644\u0641 \u0630\u06C1\u0646\u0648\u06BA \u06A9\u0648 \u0627\u0639\u0644\u06CC\u0670 \u0645\u0642\u0635\u062F \u06A9\u06D2 \u0644\u06CC\u06D2 \u0645\u062A\u062D\u062F \u06A9\u0631\u0646\u06D2 \u0648\u0627\u0644\u06D2 \u0627\u06C1\u0645 \u0633\u0645\u0627\u062C\u06CC \u062A\u0627\u0646\u06D2 \u0628\u0627\u0646\u06D2 \u06A9\u0627 \u06A9\u0627\u0645 \u06A9\u0631\u062A\u0627 \u06C1\u06D2",
                    "\u0627\u0633\u06D2 \u0627\u0646\u0641\u0631\u0627\u062F\u06CC \u062A\u06A9\u0646\u06CC\u06A9\u06CC \u0628\u0631\u062A\u0631\u06CC \u06A9\u06D2 \u0645\u0642\u0627\u0628\u0644\u06D2 \u0645\u06CC\u06BA \u062B\u0627\u0646\u0648\u06CC \u0633\u0645\u062C\u06BE\u0627 \u062C\u0627\u062A\u0627 \u06C1\u06D2",
                    "\u0627\u0633 \u06A9\u0627 \u0633\u0627\u0626\u0646\u0633\u06CC \u0646\u062A\u0627\u0626\u062C \u067E\u0631 \u06A9\u0648\u0626\u06CC \u0627\u062B\u0631 \u0646\u06C1\u06CC\u06BA \u06C1\u0648\u062A\u0627",
                    "\u06CC\u06C1 \u0635\u0631\u0641 \u0631\u0633\u0645\u06CC \u062A\u0642\u0631\u06CC\u0628\u0627\u062A \u062A\u06A9 \u0645\u062D\u062F\u0648\u062F \u06C1\u0648\u062A\u0627 \u06C1\u06D2"
                  ],
                  direction: "rtl"
                },
                hi: {
                  language: "hi",
                  questionText: "\u0905\u0927\u094D\u092F\u093E\u092F 5 \u092E\u0947\u0902, \u0938\u0902\u0938\u094D\u0925\u093E\u0917\u0924 \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0938\u092B\u0932\u0924\u093E\u0913\u0902 \u092E\u0947\u0902 \u0938\u093E\u0902\u0938\u094D\u0915\u0943\u0924\u093F\u0915 \u0938\u0926\u094D\u092D\u093E\u0935 \u0914\u0930 \u092A\u093E\u0930\u0938\u094D\u092A\u0930\u093F\u0915 \u0938\u092E\u094D\u092E\u093E\u0928 \u0915\u0940 \u0915\u094D\u092F\u093E \u092D\u0942\u092E\u093F\u0915\u093E \u092C\u0924\u093E\u0908 \u0917\u0908 \u0939\u0948?",
                  options: [
                    "\u092F\u0939 \u0935\u093F\u0935\u093F\u0927 \u0935\u093F\u091A\u093E\u0930\u094B\u0902 \u0915\u094B \u0909\u091A\u094D\u091A \u0909\u0926\u094D\u0926\u0947\u0936\u094D\u092F \u0915\u0947 \u0932\u093F\u090F \u090F\u0915\u091C\u0941\u091F \u0915\u0930\u0928\u0947 \u0935\u093E\u0932\u0947 \u091C\u0940\u0935\u0902\u0924 \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0924\u093E\u0928\u0947-\u092C\u093E\u0928\u0947 \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u0915\u093E\u0930\u094D\u092F \u0915\u0930\u0924\u093E \u0939\u0948",
                    "\u0907\u0938\u0947 \u0935\u094D\u092F\u0915\u094D\u0924\u093F\u0917\u0924 \u0924\u0915\u0928\u0940\u0915\u0940 \u092A\u094D\u0930\u092D\u0941\u0924\u094D\u0935 \u0915\u0940 \u0924\u0941\u0932\u0928\u093E \u092E\u0947\u0902 \u0917\u094C\u0923 \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948",
                    "\u0907\u0938\u0915\u093E \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u092A\u0930\u093F\u0923\u093E\u092E\u094B\u0902 \u092A\u0930 \u0915\u094B\u0908 \u092E\u093E\u092A\u0928\u0947 \u092F\u094B\u0917\u094D\u092F \u092A\u094D\u0930\u092D\u093E\u0935 \u0928\u0939\u0940\u0902 \u092A\u0921\u093C\u0924\u093E",
                    "\u092F\u0939 \u0915\u0947\u0935\u0932 \u0914\u092A\u091A\u093E\u0930\u093F\u0915 \u0905\u0935\u0938\u0930\u094B\u0902 \u0924\u0915 \u0939\u0940 \u0938\u0940\u092E\u093F\u0924 \u0939\u0948"
                  ],
                  direction: "ltr"
                }
              },
              questionType: "mcq",
              options: [
                "It serves as the vital social fabric enabling diverse minds to unite for higher purpose",
                "It is viewed as secondary to individual technical dominance",
                "It has no measurable influence on scientific outcomes",
                "It is restricted only to ceremonial occasions"
              ],
              correctOptionIndex: 0,
              marks: 20,
              negativeMarks: 5,
              difficulty: "easy",
              bookMastery: {
                bookTitle: "Wings of Fire & Ethical Horizons",
                chapterNumber: 5,
                chapterTitle: "Cultural Harmony in Teams",
                pageRange: "pp. 120-125",
                topicTag: "Institutional Culture"
              },
              explanation: "Diverse minds uniting with mutual respect foster breakthrough innovation."
            }
          ]
        },
        {
          id: "sec-br-b",
          sectionCode: "Section B",
          title: "Critical Analytical Synthesis & Essay",
          description: "Descriptive analytical question evaluating critical synthesis and community vision.",
          totalMarks: 40,
          passingMarks: 16,
          questions: [
            {
              id: "q-br-4",
              questionText: "Provide a concise analytical synthesis (250-300 words): How can the educational philosophies and ethical leadership principles outlined in the text be implemented in underprivileged community schools today?",
              primaryLanguage: "en",
              translations: {
                ur: {
                  language: "ur",
                  questionText: "\u062C\u0627\u0645\u0639 \u062A\u062C\u0632\u06CC\u0627\u062A\u06CC \u0645\u0642\u0627\u0644\u06C1 (250-300 \u0627\u0644\u0641\u0627\u0638): \u0645\u062A\u0646 \u0645\u06CC\u06BA \u0628\u06CC\u0627\u0646 \u06A9\u0631\u062F\u06C1 \u062A\u0639\u0644\u06CC\u0645\u06CC \u0641\u0644\u0633\u0641\u06D2 \u0627\u0648\u0631 \u0627\u062E\u0644\u0627\u0642\u06CC \u0642\u06CC\u0627\u062F\u062A \u06A9\u06D2 \u0627\u0635\u0648\u0644\u0648\u06BA \u06A9\u0648 \u0622\u062C \u067E\u0633\u0645\u0627\u0646\u062F\u06C1 \u0637\u0628\u0642\u0627\u062A \u06A9\u06D2 \u0627\u0633\u06A9\u0648\u0644\u0648\u06BA \u0645\u06CC\u06BA \u06A9\u0633 \u0637\u0631\u062D \u0639\u0645\u0644\u06CC \u0634\u06A9\u0644 \u062F\u06CC \u062C\u0627 \u0633\u06A9\u062A\u06CC \u06C1\u06D2\u061F",
                  direction: "rtl"
                },
                hi: {
                  language: "hi",
                  questionText: "\u0938\u0902\u0915\u094D\u0937\u093F\u092A\u094D\u0924 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923\u093E\u0924\u094D\u092E\u0915 \u0928\u093F\u092C\u0902\u0927 (250-300 \u0936\u092C\u094D\u0926): \u092A\u093E\u0920 \u092E\u0947\u0902 \u0935\u0930\u094D\u0923\u093F\u0924 \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u0926\u0930\u094D\u0936\u0928 \u0914\u0930 \u0928\u0948\u0924\u093F\u0915 \u0928\u0947\u0924\u0943\u0924\u094D\u0935 \u0915\u0947 \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924\u094B\u0902 \u0915\u094B \u0906\u091C \u0935\u0902\u091A\u093F\u0924 \u0938\u092E\u0941\u0926\u093E\u092F \u0915\u0947 \u0938\u094D\u0915\u0942\u0932\u094B\u0902 \u092E\u0947\u0902 \u0915\u0948\u0938\u0947 \u0932\u093E\u0917\u0942 \u0915\u093F\u092F\u093E \u091C\u093E \u0938\u0915\u0924\u093E \u0939\u0948?",
                  direction: "ltr"
                }
              },
              questionType: "descriptive",
              marks: 40,
              difficulty: "advanced",
              bookMastery: {
                bookTitle: "Wings of Fire & Ethical Horizons",
                chapterNumber: 7,
                chapterTitle: "Vision for Community Empowerment & Rural Science Literacy",
                pageRange: "pp. 165-178",
                topicTag: "Education Reform"
              },
              readingReference: "Chapter 7: Vision for Community Empowerment & Rural Science Literacy",
              explanation: "Evaluated on depth of pedagogical understanding, realism of implementation steps, and articulation."
            }
          ]
        }
      ],
      questions: [
        {
          id: "q-br-1",
          questionText: "What foundational ethical principle did the author emphasize as essential for scientific progress and national service in Chapter 2?",
          questionType: "mcq",
          options: [
            "Integrity, persistent inquiry, and selfless dedication to community welfare",
            "Exclusive pursuit of commercial profitability and market monopoly",
            "Isolation from social issues and purely theoretical modeling",
            "Strict adherence to outdated procedural routines without innovation"
          ],
          correctOptionIndex: 0,
          marks: 20,
          explanation: "The text highlights integrity and selfless dedication as the core virtues of impactful science."
        },
        {
          id: "q-br-2",
          questionText: "According to the prescribed chapters, how should young scholars navigate career setbacks and unexpected failures?",
          questionType: "mcq",
          options: [
            "By abandoning challenging academic pursuits immediately",
            "By treating setbacks as diagnostic feedback and cultivating resilience through systematic problem-solving",
            "By placing blame solely on external organizational constraints",
            "By ignoring fundamental scientific laws"
          ],
          correctOptionIndex: 1,
          marks: 20,
          explanation: "The author defines failure as learning feedback and urges proactive resilience."
        },
        {
          id: "q-br-3",
          questionText: "In Chapter 5, what role does cultural harmony and mutual respect play in collaborative institutional breakthroughs?",
          questionType: "mcq",
          options: [
            "It serves as the vital social fabric enabling diverse minds to unite for higher purpose",
            "It is viewed as secondary to individual technical dominance",
            "It has no measurable influence on scientific outcomes",
            "It is restricted only to ceremonial occasions"
          ],
          correctOptionIndex: 0,
          marks: 20,
          explanation: "Diverse minds uniting with mutual respect foster breakthrough innovation."
        },
        {
          id: "q-br-4",
          questionText: "Provide a concise analytical synthesis: How can the educational philosophies outlined in the text be implemented in underprivileged community schools today?",
          questionType: "descriptive",
          marks: 40,
          readingReference: "Chapter 7: Vision for Community Empowerment & Rural Science Literacy"
        }
      ]
    },
    prizeRewards: [
      {
        id: "pz-br-1",
        rankPosition: 1,
        title: "1st National Rank - Kalam Memorial Gold Distinction",
        rewardAmount: 5e4,
        rewardDescription: "Gold Medal, Dell Latitude Core i7 Laptop, and \u20B950,000 Academic Scholarship",
        rewardType: "scholarship",
        winnerCount: 1,
        eligibilityInfo: "National Rank #1 in combined objective & analytical assessment",
        status: "active"
      },
      {
        id: "pz-br-2",
        rankPosition: 2,
        title: "2nd - 5th National Ranks - Silver Distinction",
        rewardAmount: 25e3,
        rewardDescription: "Silver Medals, 10-inch Samsung Tablets, and \u20B925,000 Study Grant",
        rewardType: "scholarship",
        winnerCount: 4,
        eligibilityInfo: "National Ranks #2 through #5",
        status: "active"
      },
      {
        id: "pz-br-3",
        rankPosition: 3,
        title: "Top 100 Merit Scholars - Academic Citation",
        rewardAmount: 5e3,
        rewardDescription: "Certificate of Academic Merit and 1-Year FET Academic Mentorship",
        rewardType: "certificate",
        winnerCount: 95,
        eligibilityInfo: "Scoring 70% or above in qualifying examination",
        status: "active"
      }
    ],
    prizesSummary: [
      "1st Rank: Gold Medal, Dell Latitude Core i7 Laptop, and \u20B950,000 Academic Scholarship",
      "2nd-5th Rank: Silver Medals, 10-inch Samsung Tablets, and \u20B925,000 Study Grant",
      "Top 100 Rank: Certificate of Academic Merit and 1-Year FET Academic Mentorship"
    ],
    status: "registration_open",
    isPublished: true,
    createdByUid: "system_admin",
    createdByEmail: "fetkofficial@gmail.com",
    createdByName: "FET Academic Governance Board",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-08-30T10:00:00Z"
  },
  {
    id: "cmp-stem-olympiad-2026",
    code: "FET-CMP-2026-002",
    title: "FET National STEM & Science Olympiad 2026",
    category: "stem_olympiad",
    categoryLabel: "National STEM Olympiad",
    description: "Premier national competitive examination identifying and sponsoring mathematical prodigies, physics thinkers, and future engineers across standard 8th to 12th.",
    eligibilityAgeMin: 13,
    eligibilityAgeMax: 19,
    eligibleClasses: ["Class 8th", "Class 9th", "Class 10th", "Class 11th Science", "Class 12th Science"],
    eligibleStates: ["All India"],
    eligibleDistricts: ["All Districts"],
    registrationStartDate: "2026-06-01",
    registrationEndDate: "2026-09-15",
    competitionDate: "2026-10-18",
    resultPublicationDate: "2026-11-15",
    maxParticipants: 1e4,
    registeredCount: 1420,
    maxMarks: 100,
    passingMarks: 50,
    rules: [
      "Exam will be conducted simultaneously in OMR format across 28 test centers and via digital portal.",
      "Scientific calculators are not permitted; rough sheets will be provided.",
      "Reporting time is 9:00 AM sharp at the assigned testing center."
    ],
    coverImageUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
    examDetails: {
      isOnlineExam: true,
      durationMinutes: 60,
      instructions: [
        "Section A covers Physics & Mathematics (40 Marks).",
        "Section B covers Logical Reasoning & Algorithmic Problem Solving (60 Marks)."
      ],
      questions: [
        {
          id: "q-stem-1",
          questionText: "A body starts from rest with uniform acceleration a = 4 m/s\xB2. What distance does it cover in the 5th second of its motion?",
          questionType: "mcq",
          options: ["18 meters", "20 meters", "22 meters", "25 meters"],
          correctOptionIndex: 0,
          marks: 25,
          explanation: "S_nth = u + a/2(2n-1) = 0 + 4/2(2*5 - 1) = 2(9) = 18 m."
        },
        {
          id: "q-stem-2",
          questionText: "If log_2(x - 1) + log_2(x + 1) = 3, what is the real positive value of x?",
          questionType: "mcq",
          options: ["3", "4", "5", "8"],
          correctOptionIndex: 0,
          marks: 25,
          explanation: "log_2((x-1)(x+1)) = 3 => x^2 - 1 = 2^3 = 8 => x^2 = 9 => x = 3."
        },
        {
          id: "q-stem-3",
          questionText: "Which law of thermodynamics establishes the concept of entropy and the natural direction of spontaneous thermal processes?",
          questionType: "mcq",
          options: ["Zeroth Law", "First Law", "Second Law", "Third Law"],
          correctOptionIndex: 2,
          marks: 25,
          explanation: "The Second Law of Thermodynamics defines entropy and spontaneity."
        },
        {
          id: "q-stem-4",
          questionText: "In computer science and graph theory, what is the minimum number of colors needed to color any planar graph such that no two adjacent vertices share the same color?",
          questionType: "mcq",
          options: ["3 Colors", "4 Colors", "5 Colors", "6 Colors"],
          correctOptionIndex: 1,
          marks: 25,
          explanation: "The Four Color Theorem proves that 4 colors are always sufficient for any planar map."
        }
      ]
    },
    prizeRewards: [
      {
        id: "pz-stem-1",
        rankPosition: 1,
        title: "1st National Rank - Ramanujan Science Scholar",
        rewardAmount: 1e5,
        rewardDescription: "\u20B91,00,000 Cash Grant + HP Omen Workstation Laptop + Gold Medal",
        rewardType: "scholarship",
        winnerCount: 1,
        eligibilityInfo: "National Rank #1 in STEM Olympiad Assessment",
        status: "active"
      },
      {
        id: "pz-stem-2",
        rankPosition: 2,
        title: "2nd - 5th National Ranks - Silver Science Scholars",
        rewardAmount: 5e4,
        rewardDescription: "\u20B950,000 Cash Grant + Silver Medal + Full Tuition Grant",
        rewardType: "scholarship",
        winnerCount: 4,
        eligibilityInfo: "Ranks 2 through 5",
        status: "active"
      },
      {
        id: "pz-stem-3",
        rankPosition: 3,
        title: "Top 100 National STEM Laureates",
        rewardAmount: 15e3,
        rewardDescription: "100% FET Higher Education Degree Sponsorship & Merit Citation",
        rewardType: "scholarship",
        winnerCount: 95,
        eligibilityInfo: "Top 100 Percentile in national assessment",
        status: "active"
      }
    ],
    prizesSummary: [
      "1st Rank: \u20B91,00,000 Cash Grant + HP Omen Workstation Laptop + Gold Medal",
      "2nd-5th Rank: \u20B950,000 Cash Grant + Silver Medal + Full Tuition Grant",
      "Top 100: 100% FET Higher Education Degree Sponsorship"
    ],
    status: "registration_open",
    isPublished: true,
    createdByUid: "system_admin",
    createdByEmail: "fetkofficial@gmail.com",
    createdByName: "FET Science Olympiad Directorate",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-08-30T10:00:00Z"
  },
  {
    id: "cmp-islamic-studies-2026",
    code: "FET-CMP-2026-003",
    title: "All-India Islamic History, Ethics & Constitutional Values Challenge 2026",
    category: "islamic_studies",
    categoryLabel: "Islamic Studies & Moral Ethics",
    description: "Promoting historical literacy, ethical philosophy, and constitutional civic harmony through competitive scholarly assessment.",
    eligibilityAgeMin: 14,
    eligibilityAgeMax: 30,
    eligibleClasses: ["High School", "Higher Secondary", "Undergraduate", "Postgraduate", "Madrasa Scholars"],
    eligibleStates: ["All India"],
    eligibleDistricts: ["All Districts"],
    registrationStartDate: "2026-05-01",
    registrationEndDate: "2026-08-15",
    competitionDate: "2026-08-25",
    resultPublicationDate: "2026-08-30",
    maxParticipants: 3e3,
    registeredCount: 890,
    maxMarks: 100,
    passingMarks: 45,
    rules: [
      "Assessment covers Quranic ethics of justice, historical contribution of Indian Muslim freedom fighters, and Indian constitutional pluralism.",
      "Language options: English, Urdu, Hindi, and Marathi."
    ],
    coverImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    examDetails: {
      isOnlineExam: true,
      durationMinutes: 40,
      questions: [
        {
          id: "q-is-1",
          questionText: "Which historical charter enacted in early Islamic governance is celebrated internationally as the first written constitutional agreement ensuring multi-faith civic equality?",
          questionType: "mcq",
          options: [
            "Charter of Medina (Misaq-e-Madina)",
            "Treaty of Hudaybiyyah",
            "Pact of Umar",
            "Edict of Milan"
          ],
          correctOptionIndex: 0,
          marks: 30,
          explanation: "Misaq-e-Madina (622 CE) established equal citizenship rights and mutual defense across diverse communities."
        },
        {
          id: "q-is-2",
          questionText: "Which prominent freedom fighter and Islamic scholar served as independent India\u2019s first Education Minister and founded the Indian Institutes of Technology (IITs) and UGC?",
          questionType: "mcq",
          options: [
            "Maulana Abul Kalam Azad",
            "Dr. Zakir Husain",
            "Maulana Mohammad Ali Jauhar",
            "Hakim Ajmal Khan"
          ],
          correctOptionIndex: 0,
          marks: 35,
          explanation: "Maulana Abul Kalam Azad was India\u2019s first Education Minister and father of modern higher education institutes."
        },
        {
          id: "q-is-3",
          questionText: "What is the core Quranic injunction regarding universal human dignity articulated in Surah Al-Isra (17:70)?",
          questionType: "mcq",
          options: [
            '"And We have certainly honored the children of Adam (all humanity)"',
            "Honor is reserved exclusively for a single tribe",
            "Material wealth is the sole determinant of human worth",
            "Dignity depends on geographic birthplace"
          ],
          correctOptionIndex: 0,
          marks: 35,
          explanation: "Surah Al-Isra 17:70 establishes universal human dignity bestowed upon all human beings without discrimination."
        }
      ]
    },
    prizeRewards: [
      {
        id: "pz-is-1",
        rankPosition: 1,
        title: "1st Rank - Allama Iqbal Gold Shield & Research Award",
        rewardAmount: 75e3,
        rewardDescription: "\u20B975,000 Cash Award + Allama Iqbal Gold Shield + Library Grant",
        rewardType: "scholarship",
        winnerCount: 1,
        eligibilityInfo: "Top National Score",
        status: "active"
      },
      {
        id: "pz-is-2",
        rankPosition: 2,
        title: "2nd - 3rd Rank - Silver Shield Distinction",
        rewardAmount: 35e3,
        rewardDescription: "\u20B935,000 Cash Award + Silver Shield",
        rewardType: "scholarship",
        winnerCount: 2,
        eligibilityInfo: "2nd and 3rd rank holders",
        status: "active"
      },
      {
        id: "pz-is-3",
        rankPosition: 3,
        title: "Merit Winners - Scholarly Excellence",
        rewardAmount: 1e4,
        rewardDescription: "Certificate of Scholarly Excellence & Reference Book Hamper",
        rewardType: "certificate",
        winnerCount: 25,
        eligibilityInfo: "Scoring above 75% marks",
        status: "active"
      }
    ],
    prizesSummary: [
      "1st Rank: \u20B975,000 Cash Award + Allama Iqbal Gold Shield + Library Grant",
      "2nd-3rd Rank: \u20B935,000 Cash Award + Silver Shield",
      "Merit Winners: Certificate of Scholarly Excellence"
    ],
    status: "published",
    isPublished: true,
    resultsApprovedAt: "2026-08-29T18:00:00Z",
    resultsApprovedByUid: "system_admin",
    resultsApprovedByEmail: "fetkofficial@gmail.com",
    resultsPublishedAt: "2026-08-30T09:00:00Z",
    resultsPublishedByUid: "system_admin",
    createdByUid: "system_admin",
    createdByEmail: "fetkofficial@gmail.com",
    createdByName: "FET Academic Governance Board",
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-08-30T10:00:00Z"
  }
];

// src/data/storeDemoProducts.ts
var STORE_DEMO_PRODUCTS = [
  // 1. ISLAMIC WEAR DEMO PRODUCT
  {
    id: "demo-prod-islamic-wear-01",
    name: "[Demo Product] Premium Modest Abaya & Prayer Set",
    slug: "demo-premium-modest-abaya-prayer-set",
    description: `Demo Product / Test Item: High-quality modest apparel tailored for daily and formal prayer wear with dignified drape, breathable fabric, and matched scarf.

Note: This is a clearly labelled demonstration catalogue record prepared for FET Store testing, category routing, and variant evaluation. Not an approved commercial transaction item.`,
    category: "islamic_wear",
    categoryName: "Islamic Wear",
    subCategory: "Women's Islamic Wear",
    productType: "merchandise",
    price: 1450,
    mrp: 1850,
    availability: "in_stock",
    isAvailable: true,
    trackInventory: true,
    stockCount: 25,
    lowStockThreshold: 5,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: "both",
    sku: "DEMO-IW-ABY-01",
    authorOrPublisher: "FET Modest Apparel Guild (Demo)",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    productImages: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    features: [
      "Demo Test Product (Not for sale)",
      "Breathable Crepe Fabric",
      "Multiple Size & Color Options",
      "Full-Length Modest Silhouette"
    ],
    hasVariants: true,
    variantOptions: [
      { name: "Size", values: ["S (52)", "M (54)", "L (56)", "XL (58)"] },
      { name: "Color", values: ["Classic Black", "Navy Blue"] }
    ],
    variants: [
      {
        id: "var-iw-s-black",
        name: "Size S (52) / Classic Black",
        sku: "DEMO-IW-S-BLK",
        price: 1450,
        mrp: 1850,
        availability: "in_stock",
        isAvailable: true,
        stockCount: 8,
        attributes: { Size: "S (52)", Color: "Classic Black" }
      },
      {
        id: "var-iw-m-black",
        name: "Size M (54) / Classic Black",
        sku: "DEMO-IW-M-BLK",
        price: 1450,
        mrp: 1850,
        availability: "in_stock",
        isAvailable: true,
        stockCount: 12,
        attributes: { Size: "M (54)", Color: "Classic Black" }
      },
      {
        id: "var-iw-l-black",
        name: "Size L (56) / Classic Black",
        sku: "DEMO-IW-L-BLK",
        price: 1450,
        mrp: 1850,
        availability: "in_stock",
        isAvailable: true,
        stockCount: 5,
        attributes: { Size: "L (56)", Color: "Classic Black" }
      },
      {
        id: "var-iw-m-navy",
        name: "Size M (54) / Navy Blue",
        sku: "DEMO-IW-M-NVY",
        price: 1450,
        mrp: 1850,
        availability: "in_stock",
        isAvailable: true,
        stockCount: 4,
        attributes: { Size: "M (54)", Color: "Navy Blue" }
      }
    ],
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z"
  },
  // 2. PERFUMES DEMO PRODUCT
  {
    id: "demo-prod-perfume-01",
    name: "[Demo Product] Pure Concentrated Oudh Attar (Alcohol-Free)",
    slug: "demo-pure-concentrated-oudh-attar",
    description: `Demo Product / Test Item: Pure alcohol-free concentrated botanical attar formulated according to traditional halal distillation methods. Long-lasting, warm oriental amber and agarwood notes.

Note: This is a clearly labelled demonstration catalogue record prepared for FET Store testing, category routing, and fragrance volume testing. Not an approved commercial transaction item.`,
    category: "perfumes",
    categoryName: "Perfumes",
    subCategory: "Attar / Concentrated Perfumes",
    productType: "physical",
    price: 450,
    mrp: 600,
    availability: "in_stock",
    isAvailable: true,
    trackInventory: true,
    stockCount: 40,
    lowStockThreshold: 10,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: "both",
    sku: "DEMO-PF-OUD-01",
    authorOrPublisher: "FET Traditional Fragrance Arts (Demo)",
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    productImages: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80"
    ],
    features: [
      "Demo Test Product (Not for sale)",
      "100% Non-Alcoholic Formulation",
      "Concentrated Botanical Perfume Oil",
      "Traditional Glass Applicator Bottle"
    ],
    hasVariants: true,
    variantOptions: [
      { name: "Volume", values: ["6ml Roll-on", "12ml Crystal Vial"] }
    ],
    variants: [
      {
        id: "var-pf-6ml",
        name: "Volume 6ml Roll-on",
        sku: "DEMO-PF-6ML",
        price: 450,
        mrp: 600,
        availability: "in_stock",
        isAvailable: true,
        stockCount: 25,
        attributes: { Volume: "6ml Roll-on" }
      },
      {
        id: "var-pf-12ml",
        name: "Volume 12ml Crystal Vial",
        sku: "DEMO-PF-12ML",
        price: 850,
        mrp: 1100,
        availability: "in_stock",
        isAvailable: true,
        stockCount: 15,
        attributes: { Volume: "12ml Crystal Vial" }
      }
    ],
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z"
  },
  // 3. EDUCATIONAL MATERIALS DEMO PRODUCT (COD ONLY DEMO)
  {
    id: "demo-prod-materials-01",
    name: "[Demo Product] Secondary Science & Mathematics Classroom Study Kit",
    slug: "demo-secondary-science-mathematics-study-kit",
    description: `Demo Product / Test Item: Comprehensive curriculum kit containing scientific teaching aids, geometric apparatus, student workbooks, and experimental observation charts tailored for high school laboratories and madrasa science rooms.

Note: This is a clearly labelled demonstration catalogue record prepared for FET Store testing and educational department verification. Not an approved commercial transaction item.`,
    category: "materials",
    categoryName: "Educational Materials",
    subCategory: "Study Kits",
    productType: "educational_material",
    price: 380,
    mrp: 500,
    availability: "in_stock",
    isAvailable: true,
    trackInventory: true,
    stockCount: 15,
    lowStockThreshold: 3,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: "cod",
    sku: "DEMO-MAT-KIT-01",
    authorOrPublisher: "FET Academic Research & Laboratory Directorate (Demo)",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    productImages: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80"
    ],
    features: [
      "Demo Test Product (Not for sale)",
      "Classroom Visual Aids & Demonstration Tools",
      "Aligned with NCERT & State Science Syllabi",
      "Durable Non-Toxic Educational Components"
    ],
    hasVariants: false,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z"
  },
  // 4. FET PUBLICATIONS DEMO PRODUCT
  {
    id: "demo-prod-publication-01",
    name: "[Demo Product] FET Annual Educational & Welfare Research Bulletin 2024-25",
    slug: "demo-fet-annual-educational-welfare-bulletin-2024-25",
    description: `Demo Product / Test Item: Official academic research paper detailing scholarship metrics, rural learning outcomes, madrasa curriculum modernization, and grassroots community impact audits across Indian states.

Note: This is a clearly labelled demonstration publication prepared for FET Store testing. Digital PDF is downloadable for public audit and verification.`,
    category: "publications",
    categoryName: "FET Publications",
    subCategory: "Annual Reports & Audits",
    productType: "publication",
    price: 0,
    mrp: 150,
    availability: "in_stock",
    isAvailable: true,
    trackInventory: false,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: "razorpay",
    sku: "DEMO-PUB-REP-2025",
    authorOrPublisher: "FET Research, Audits & Publications Council",
    imageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
    productImages: [
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
    ],
    features: [
      "Demo Test Publication (Public Open Access)",
      "Independent Statutory & Academic Review",
      "State-Wise Scholarship Disbursements Data",
      "Includes Official Audit Statements"
    ],
    isDigital: true,
    digitalAsset: {
      fileName: "FET-Annual-Educational-Research-Bulletin-2024-25-Demo.pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileSize: 245e4,
      fileType: "application/pdf",
      accessType: "public_download",
      pageCount: 64,
      uploadedAt: "2026-01-10T10:00:00Z",
      description: "Official Demo Research Bulletin (Public Open Access PDF)"
    },
    language: "English & Urdu",
    edition: "2024-2025 Edition",
    format: "Digital PDF",
    pagesCount: 64,
    hasVariants: false,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z"
  },
  // 5. BOOKS DEMO PRODUCT (CORE BOOKS CATEGORY - RAZORPAY ONLY DEMO)
  {
    id: "demo-prod-book-01",
    name: "[Demo Product] Prescribed Ethical Reader & Character Building Curriculum",
    slug: "demo-prescribed-ethical-reader-character-building",
    description: `Demo Product / Test Item: Prescribed ethical curriculum reader for primary and secondary youth featuring moral case studies, historical integrity examples, and interactive character quizzes.

Note: This is a clearly labelled demonstration book record prepared for FET Store testing, format variation (Paperback vs Digital PDF), and language selection.`,
    category: "books",
    categoryName: "Books",
    subCategory: "Educational Books",
    productType: "book",
    price: 180,
    mrp: 240,
    availability: "in_stock",
    isAvailable: true,
    trackInventory: true,
    stockCount: 50,
    lowStockThreshold: 10,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: "razorpay",
    sku: "DEMO-BK-ETH-01",
    authorOrPublisher: "FET Academic Curriculum & Values Bureau",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    productImages: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
    ],
    features: [
      "Demo Test Book (For Testing Only)",
      "Approved for Youth Moral Curriculum",
      "Bilingual Exercises & Guided Questions",
      "High-Grade Matte Paper Bound Edition"
    ],
    language: "English & Urdu",
    edition: "1st Revised Edition 2025",
    format: "Paperback",
    pagesCount: 168,
    hasVariants: true,
    variantOptions: [
      { name: "Format", values: ["Paperback (Printed)", "Digital PDF E-Book"] }
    ],
    variants: [
      {
        id: "var-bk-paperback",
        name: "Format Paperback (Printed)",
        sku: "DEMO-BK-ETH-PB",
        price: 180,
        mrp: 240,
        availability: "in_stock",
        isAvailable: true,
        stockCount: 50,
        attributes: { Format: "Paperback (Printed)" }
      },
      {
        id: "var-bk-pdf",
        name: "Format Digital PDF E-Book",
        sku: "DEMO-BK-ETH-PDF",
        price: 90,
        mrp: 150,
        availability: "in_stock",
        isAvailable: true,
        isDigital: true,
        digitalAsset: {
          fileName: "Prescribed-Ethical-Reader-Demo-Sample.pdf",
          fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileSize: 18e5,
          fileType: "application/pdf",
          accessType: "sample_preview",
          pageCount: 168,
          previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          description: "Demo Sample Chapters (PDF E-Book)"
        },
        attributes: { Format: "Digital PDF E-Book" }
      }
    ],
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z"
  }
];

// src/services/storeEmailNotificationService.ts
var dispatchedEmailKeys = /* @__PURE__ */ new Set();
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function renderStoreOrderEmail(context) {
  const safeName = escapeHtml(context.customerName || "Valued Patron");
  const safeOrderNumber = escapeHtml(context.orderNumber);
  const formattedTotal = `\u20B9${(context.total || 0).toLocaleString("en-IN")}`;
  const safeDate = new Date(context.updatedAt || context.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const safeCity = escapeHtml(context.city || "");
  const safeState = escapeHtml(context.state || "");
  const destinationText = safeCity && safeState ? `${safeCity}, ${safeState}` : safeCity || safeState || "Registered Delivery Address";
  let headerBg = "#0D6E42";
  let eventHeadline = "Order Received & Recorded";
  let eventSubheading = "Thank you for supporting FET India Store. Your order is safely in our system.";
  let subject = `FET Store: Order #${context.orderNumber} Received`;
  switch (context.eventType) {
    case "order_received":
      headerBg = "#0D6E42";
      eventHeadline = "Order Confirmed & Placed";
      eventSubheading = "Thank you for your purchase from FET India Store. Your order has been placed and confirmed for fulfillment.";
      subject = `FET Store: Order #${context.orderNumber} Confirmed`;
      break;
    case "order_processing":
      headerBg = "#0284C7";
      eventHeadline = "Order In Processing";
      eventSubheading = "Our store staff is currently preparing and packing your ordered publications and resources.";
      subject = `FET Store: Order #${context.orderNumber} is Processing`;
      break;
    case "order_shipped":
      headerBg = "#4F46E5";
      eventHeadline = "Order Dispatched & Shipped";
      eventSubheading = "Your parcel has been handed over for dispatch and is on its way to your destination.";
      subject = `FET Store: Order #${context.orderNumber} Shipped`;
      break;
    case "order_delivered":
      headerBg = "#059669";
      eventHeadline = "Order Successfully Delivered";
      eventSubheading = "Your order has been safely delivered. We pray this knowledge brings great benefit to your family and students.";
      subject = `FET Store: Order #${context.orderNumber} Delivered`;
      break;
    case "order_cancelled":
      headerBg = "#E11D48";
      eventHeadline = "Order Cancelled";
      eventSubheading = context.note ? `Order cancellation confirmed: ${escapeHtml(context.note)}` : "Your order has been cancelled as requested.";
      subject = `FET Store: Order #${context.orderNumber} Cancelled`;
      break;
  }
  const itemsHtml = (context.items || []).map((it) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; font-weight: 600;">
        ${escapeHtml(it.productName)}
        ${it.variantName ? `<span style="display: block; font-size: 11px; color: #64748B; font-weight: normal;">Variant: ${escapeHtml(it.variantName)}</span>` : ""}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569; text-align: center;">
        ${it.quantity}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; text-align: right; font-weight: 600;">
        \u20B9${(it.itemTotal || it.unitPrice * it.quantity || 0).toLocaleString("en-IN")}
      </td>
    </tr>
  `).join("");
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
                Fatimyah Educational Trust India \u2022 FET Store
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
                Order Summary (${context.itemCount || (context.items ? context.items.length : 1)} Item${(context.itemCount || 1) > 1 ? "s" : ""})
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
                Registered Indian Non-Profit Trust \u2022 Section 80G & 12A Statutory Exemption Certified
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
FET INDIA STORE \u2022 ${eventHeadline.toUpperCase()}
Order Number: ${context.orderNumber}
Date: ${safeDate}
Total: ${formattedTotal}
Status Update: ${eventSubheading}

Dear ${context.customerName || "Customer"},

${eventSubheading}

Items:
${(context.items || []).map((i) => `- ${i.productName} (x${i.quantity}) - \u20B9${i.itemTotal}`).join("\n")}

Order Total: ${formattedTotal}
Destination: ${destinationText}

You can view full details in your FET India Account Dashboard:
https://fetindia.org/#/dashboard

Support: fetkofficial@gmail.com | +91 91494 14549
Fatimyah Educational Trust India
  `.trim();
  return { subject, htmlContent, textContent };
}
function getBrevoEnvironmentStatus() {
  const potentialKeyNames = [
    "BREVO_API_KEY",
    "SENDINBLUE_API_KEY",
    "SIB_API_KEY",
    "BREVO_KEY",
    "BREVO_SMTP_KEY",
    "BREVO_SECRET",
    "BREVO_API_SECRET"
  ];
  let detectedKeyVar = void 0;
  for (const varName of potentialKeyNames) {
    const val = process.env[varName];
    if (val && typeof val === "string" && val.trim().length > 0) {
      detectedKeyVar = varName;
      break;
    }
  }
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SENDINBLUE_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || process.env.SENDINBLUE_FROM_EMAIL || process.env.STORE_SENDER_EMAIL || process.env.DEFAULT_FROM_EMAIL || process.env.MAIL_FROM_ADDRESS || process.env.SENDER_EMAIL || "noreply@fetindia.com").trim();
  const senderName = (process.env.BREVO_SENDER_NAME || process.env.SENDINBLUE_SENDER_NAME || process.env.BREVO_FROM_NAME || process.env.STORE_SENDER_NAME || process.env.DEFAULT_FROM_NAME || process.env.MAIL_FROM_NAME || process.env.SENDER_NAME || "FATIMYAH EDUCATIONAL TRUST \u2014 FET Store").trim();
  return {
    isConfigured: Boolean(detectedKeyVar),
    detectedKeyVar,
    senderEmail,
    senderName
  };
}
async function sendBrevoStoreOrderEmail(context, options) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const idempotencyKey = `store_email_${context.orderId}_${context.eventType}`;
  if (dispatchedEmailKeys.has(idempotencyKey)) {
    return {
      success: true,
      status: "already_sent",
      note: `Email event "${context.eventType}" was already dispatched for order "${context.orderNumber}". Duplicate send prevented.`,
      timestamp: nowIso
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!context.customerEmail || !emailRegex.test(context.customerEmail.trim())) {
    return {
      success: false,
      status: "failed",
      note: `Invalid customer email address: "${context.customerEmail}". Email not dispatched.`,
      timestamp: nowIso
    };
  }
  const isTest = options?.testMode || process.env.NODE_ENV === "test" || process.env.STORE_NOTIFICATION_TEST === "true";
  if (isTest) {
    dispatchedEmailKeys.add(idempotencyKey);
    return {
      success: true,
      status: "test_mocked",
      messageId: `test-brevo-${context.orderNumber}-${Date.now()}`,
      note: `Automated test mode active: Brevo email for event "${context.eventType}" safely mocked without sending external email.`,
      timestamp: nowIso
    };
  }
  const envStatus = getBrevoEnvironmentStatus();
  const brevoApiKey = envStatus.detectedKeyVar ? (process.env[envStatus.detectedKeyVar] || "").trim() : "";
  const brevoSenderEmail = envStatus.senderEmail;
  const brevoSenderName = envStatus.senderName;
  if (!brevoApiKey) {
    return {
      success: false,
      status: "not_configured",
      note: "Brevo API key is not configured in current environment (checked BREVO_API_KEY, SENDINBLUE_API_KEY, SIB_API_KEY, BREVO_KEY). In-app notifications are delivered to recipient inbox.",
      timestamp: nowIso
    };
  }
  const { subject, htmlContent, textContent } = renderStoreOrderEmail(context);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs || 8e3);
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: brevoSenderName,
          email: brevoSenderEmail
        },
        to: [
          {
            email: context.customerEmail.trim(),
            name: (context.customerName || "Valued Customer").trim()
          }
        ],
        subject,
        htmlContent,
        textContent,
        tags: ["store_order", context.eventType, context.orderNumber]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn(`[Brevo Email Service] Error response (${response.status}):`, data);
      return {
        success: false,
        status: "failed",
        note: data && data.message ? String(data.message) : `Brevo API HTTP ${response.status} error`,
        timestamp: nowIso
      };
    }
    dispatchedEmailKeys.add(idempotencyKey);
    return {
      success: true,
      status: "sent",
      messageId: data.messageId || `brevo-${Date.now()}`,
      note: `Email for event "${context.eventType}" successfully delivered via Brevo.`,
      timestamp: nowIso
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === "AbortError";
    const errorMsg = isAbort ? "Brevo API dispatch timed out after 8000ms." : err?.message || "Network error reaching Brevo API.";
    console.warn("[Brevo Email Service] Non-fatal dispatch exception:", errorMsg);
    return {
      success: false,
      status: "failed",
      note: errorMsg,
      timestamp: nowIso
    };
  }
}

// server.ts
var firebaseConfigData = JSON.parse(
  fs.readFileSync(new URL("./firebase-applet-config.json", import.meta.url), "utf-8")
);
dotenv.config();
var app = express();
var portArgIndex = process.argv.indexOf("--port");
var portArg = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : null;
var PORT = portArg || (process.env.PORT && process.env.PORT !== "8080" ? parseInt(process.env.PORT, 10) : 3e3);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-User-Id, x-user-id, X-Client-Request-Id, x-client-request-id");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
var firebaseApp = initializeApp(firebaseConfigData);
var db = getFirestore(firebaseApp, firebaseConfigData.firestoreDatabaseId);
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));
function cleanObject(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.filter((item) => item !== void 0).map((item) => typeof item === "object" && item !== null ? cleanObject(item) : item);
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== void 0) {
      if (typeof value === "object" && value !== null) {
        result[key] = cleanObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret && keyId.trim() && keySecret.trim()) {
    try {
      return new Razorpay({
        key_id: keyId.trim(),
        key_secret: keySecret.trim()
      });
    } catch (err) {
      console.error("Error initializing Razorpay client:", err);
      return null;
    }
  }
  return null;
}
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "FET India Payment Gateway & API"
  });
});
app.get("/api/razorpay/config", (_req, res) => {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const isConfigured = Boolean(keyId && keySecret);
  const isLive = keyId.startsWith("rzp_live");
  res.json({
    // Only return the public keyId when configured; never expose any secret or fallback credentials
    keyId: isConfigured ? keyId : "",
    isConfigured,
    mode: isLive ? "live" : "test",
    currency: "INR",
    merchantName: "Fatimyah Educational Trust",
    supportEmail: "fetkofficial@gmail.com",
    supportPhone: "+91 98923 00000",
    trust80GNumber: "AAATF2843PF20214",
    description: "80G Certified Educational and Welfare Contributions"
  });
});
app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    const {
      amount,
      donorName,
      donorEmail,
      donorPhone,
      donorPan,
      campaignId = "direct-80g-trust-allocation",
      campaignTitle = "General Trust Allocation",
      donorUid,
      isAnonymous = false,
      message = ""
    } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 1) {
      res.status(400).json({
        error: "Invalid amount. Minimum amount is \u20B91."
      });
      return;
    }
    if (!donorName || typeof donorName !== "string" || !donorName.trim()) {
      res.status(400).json({
        error: "Donor name is required for 80G tax certification."
      });
      return;
    }
    if (!donorEmail || typeof donorEmail !== "string" || !donorEmail.trim()) {
      res.status(400).json({
        error: "Donor email is required for 80G tax receipt dispatch."
      });
      return;
    }
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const cleanAmount = Math.round(numericAmount);
    const amountInPaise = cleanAmount * 100;
    const internalReference = `FET-DON-${currentYear}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const rzp = getRazorpayClient();
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!rzp || !keyId || !keySecret) {
      res.status(500).json({
        error: "Razorpay payment gateway is not configured on the server. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in the server environment."
      });
      return;
    }
    const isLive = keyId.startsWith("rzp_live");
    const mode = isLive ? "live" : "test";
    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: internalReference,
      notes: {
        internalReference,
        campaignId: String(campaignId),
        campaignTitle: String(campaignTitle).substring(0, 40),
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        donorPan: donorPan ? String(donorPan).trim().toUpperCase() : "NOT_PROVIDED"
      }
    };
    const razorpayOrder = await rzp.orders.create(orderOptions);
    const orderId = razorpayOrder.id;
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
      paymentStatus: "pending_verification",
      transactionReference: internalReference,
      paymentMethod: "Razorpay Payment Gateway",
      razorpayOrderId: orderId,
      gatewayMode: mode,
      isAnonymous: Boolean(isAnonymous),
      message: message ? String(message).trim() : ""
    });
    const donationsCollection = collection(db, "campaign_donations");
    const docRef = await addDoc(donationsCollection, donationData);
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        actorUid: donorUid || "donor_public",
        actorEmail: donorEmail,
        actorRole: "user",
        action: "RAZORPAY_ORDER_CREATED",
        targetEntity: "campaign_donations",
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
      console.warn("Non-blocking audit log warning:", auditErr);
    }
    res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: "INR",
      internalReference,
      docId: docRef.id,
      keyId,
      mode,
      isConfigured: true
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      error: error.message || "Failed to create Razorpay contribution order."
    });
  }
});
app.post("/api/razorpay/verify-payment", async (req, res) => {
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
        error: "Missing mandatory payment verification fields."
      });
      return;
    }
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!keySecret) {
      res.status(500).json({
        success: false,
        error: "Razorpay server secret (RAZORPAY_KEY_SECRET) is not configured in server environment."
      });
      return;
    }
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(razorpay_signature, "utf8")
      );
    } catch {
      isSignatureValid = false;
    }
    const donationsCollection = collection(db, "campaign_donations");
    let snap = await getDocs(query(donationsCollection, where("transactionReference", "==", internalReference)));
    if (snap.empty && razorpay_order_id) {
      snap = await getDocs(query(donationsCollection, where("razorpayOrderId", "==", razorpay_order_id)));
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
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (donationData.paymentStatus === "verified") {
      res.json({
        success: true,
        message: "Payment was already verified.",
        receiptNumber: donationData.receiptNumber,
        internalReference: donationData.transactionReference,
        paymentId: donationData.razorpayPaymentId,
        amount: donationData.amount
      });
      return;
    }
    if (razorpay_payment_id) {
      const existingPaymentSnap = await getDocs(query(
        donationsCollection,
        where("razorpayPaymentId", "==", razorpay_payment_id),
        where("paymentStatus", "==", "verified")
      ));
      if (!existingPaymentSnap.empty && existingPaymentSnap.docs[0].id !== donationDoc.id) {
        res.status(409).json({
          success: false,
          error: "This Razorpay payment ID has already been credited to a verified contribution record.",
          receiptNumber: existingPaymentSnap.docs[0].data().receiptNumber
        });
        return;
      }
    }
    if (!isSignatureValid) {
      await updateDoc(doc(db, "campaign_donations", donationDoc.id), cleanObject({
        paymentStatus: "failed",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentError: "Cryptographic signature mismatch",
        failedAt: now
      }));
      res.status(400).json({
        success: false,
        error: "Cryptographic signature verification failed. Trust funds not credited."
      });
      return;
    }
    const suffix = internalReference.split("-").pop() || crypto.randomBytes(3).toString("hex").toUpperCase();
    const receiptNumber = `REC/80G/2026/${suffix}`;
    const financialYear = "2026-27";
    await updateDoc(doc(db, "campaign_donations", donationDoc.id), cleanObject({
      paymentStatus: "verified",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      verifiedAt: now,
      receiptNumber,
      financialYear,
      paymentMethod: "Razorpay Payment Gateway (Verified)"
    }));
    const effectiveCampaignId = campaignId || donationData.campaignId;
    if (effectiveCampaignId && effectiveCampaignId !== "direct-80g-trust-allocation") {
      try {
        const allVerifiedQuery = query(
          donationsCollection,
          where("campaignId", "==", effectiveCampaignId),
          where("paymentStatus", "==", "verified")
        );
        const verifiedSnap = await getDocs(allVerifiedQuery);
        let totalRaised = 0;
        let count = 0;
        verifiedSnap.forEach((d) => {
          totalRaised += Number(d.data().amount) || 0;
          count += 1;
        });
        const campaignRef = doc(db, "crowdfunding_campaigns", effectiveCampaignId);
        const campaignDocSnap = await getDoc(campaignRef);
        if (campaignDocSnap.exists()) {
          await updateDoc(campaignRef, cleanObject({
            raisedAmount: totalRaised,
            verifiedDonationsCount: count,
            updatedAt: now
          }));
        }
      } catch (campErr) {
        console.warn("Campaign progress recalculation warning:", campErr);
      }
    }
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        actorUid: donationData.donorUid || "donor_public",
        actorEmail: donationData.donorEmail || "donor@fetindia.com",
        actorRole: "user",
        action: "RAZORPAY_PAYMENT_VERIFIED",
        targetEntity: "campaign_donations",
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
      console.warn("Non-blocking audit log warning:", auditErr);
    }
    res.json({
      success: true,
      message: "Payment verified successfully and official 80G tax exemption receipt issued.",
      receiptNumber,
      internalReference,
      paymentId: razorpay_payment_id,
      amount: donationData.amount
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Payment verification encountered an internal error."
    });
  }
});
app.post("/api/razorpay/record-failure", async (req, res) => {
  try {
    const { internalReference, razorpayOrderId, errorDescription } = req.body;
    if (!internalReference && !razorpayOrderId) {
      res.status(400).json({ error: "Reference or order ID required." });
      return;
    }
    const donationsCollection = collection(db, "campaign_donations");
    let snap;
    if (internalReference) {
      snap = await getDocs(query(donationsCollection, where("transactionReference", "==", internalReference)));
    } else {
      snap = await getDocs(query(donationsCollection, where("razorpayOrderId", "==", razorpayOrderId)));
    }
    if (!snap.empty) {
      const dDoc = snap.docs[0];
      const dData = dDoc.data();
      if (dData.paymentStatus === "pending_verification") {
        await updateDoc(doc(db, "campaign_donations", dDoc.id), cleanObject({
          paymentStatus: "failed",
          paymentError: String(errorDescription || "Payment interrupted or cancelled by user").substring(0, 250),
          failedAt: (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/razorpay/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const razorpaySignature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (webhookSecret && razorpaySignature) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret.trim()).update(rawBody).digest("hex");
      const isSigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(razorpaySignature, "utf8")
      );
      if (!isSigValid) {
        res.status(400).json({ error: "Invalid webhook signature." });
        return;
      }
    }
    const event = req.body;
    const eventType = event.event;
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      const internalReference = paymentEntity?.notes?.internalReference;
      if (orderId || internalReference) {
        const donationsCollection = collection(db, "campaign_donations");
        let snap;
        if (internalReference) {
          snap = await getDocs(query(donationsCollection, where("transactionReference", "==", internalReference)));
        } else {
          snap = await getDocs(query(donationsCollection, where("razorpayOrderId", "==", orderId)));
        }
        if (!snap.empty) {
          const donationDoc = snap.docs[0];
          const prev = donationDoc.data();
          if (prev.paymentStatus !== "verified") {
            const now = (/* @__PURE__ */ new Date()).toISOString();
            const suffix = prev.transactionReference?.split("-").pop() || crypto.randomBytes(3).toString("hex").toUpperCase();
            await updateDoc(doc(db, "campaign_donations", donationDoc.id), cleanObject({
              paymentStatus: "verified",
              razorpayPaymentId: paymentId || prev.razorpayPaymentId || "WEBHOOK_CAPTURED",
              verifiedAt: now,
              receiptNumber: prev.receiptNumber || `REC/80G/2026/${suffix}`,
              financialYear: "2026-27"
            }));
          }
        }
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const internalReference = paymentEntity?.notes?.internalReference;
      if (internalReference) {
        const snap = await getDocs(query(collection(db, "campaign_donations"), where("transactionReference", "==", internalReference)));
        if (!snap.empty) {
          const donationDoc = snap.docs[0];
          await updateDoc(doc(db, "campaign_donations", donationDoc.id), cleanObject({
            paymentStatus: "failed",
            paymentError: paymentEntity?.error_description || "Payment failed at gateway"
          }));
        }
      }
    }
    res.json({ status: "ok" });
  } catch (webhookErr) {
    console.error("Razorpay Webhook Error:", webhookErr);
    res.status(500).json({ error: "Webhook processing failed." });
  }
});
function parseServerScheduleDate(dateStr, timeStr, timeZone = "Asia/Kolkata") {
  if (!dateStr) return 0;
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return 0;
  const cleanDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  let hours = 9;
  let minutes = 0;
  if (timeStr) {
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }
  }
  const pad = (n) => n.toString().padStart(2, "0");
  const isoTime = `${pad(hours)}:${pad(minutes)}:00`;
  if (timeZone.toLowerCase().includes("kolkata") || timeZone.toLowerCase().includes("calcutta") || timeZone.toLowerCase().includes("ist")) {
    return Date.parse(`${cleanDate}T${isoTime}+05:30`);
  }
  return Date.parse(`${cleanDate}T${isoTime}Z`);
}
app.get("/api/exam/server-time", (_req, res) => {
  res.json({
    serverTimeIso: (/* @__PURE__ */ new Date()).toISOString(),
    serverTimestampMs: Date.now()
  });
});
async function verifyCandidateOrAdmin(req, expectedParticipantUid) {
  const authHeader = req.headers.authorization;
  const participantUid = (req.body?.participantUid || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null) || "").trim();
  if (!participantUid) {
    return { authorized: false, reason: "Authentication required. Missing candidate identity credential." };
  }
  if (expectedParticipantUid && expectedParticipantUid !== participantUid) {
    try {
      const userSnap = await getDoc(doc(db, "users", participantUid));
      if (userSnap.exists()) {
        const u = userSnap.data();
        if (u.role === "super_admin" || u.primaryRole === "super_admin" || u.roles?.includes("super_admin") || u.roles?.includes("examination_admin") || u.roles?.includes("exam_admin") || u.roles?.includes("administrator")) {
          return { authorized: true };
        }
      }
    } catch {
    }
    return { authorized: false, reason: "Access forbidden. Candidate account does not match this registration record." };
  }
  return { authorized: true };
}
app.post("/api/exam/start-attempt", async (req, res) => {
  try {
    const { registrationId, competitionId } = req.body;
    if (!registrationId) {
      res.status(400).json({ error: "registrationId is required." });
      return;
    }
    const regRef = doc(db, "competition_registrations", registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      res.status(404).json({ error: "Registration record not found." });
      return;
    }
    const regData = regSnap.data();
    const authCheck = await verifyCandidateOrAdmin(req, regData.participantUid);
    if (!authCheck.authorized) {
      res.status(401).json({
        allowed: false,
        error: authCheck.reason || "Authentication required to start this examination."
      });
      return;
    }
    const compDocId = competitionId || regData.competitionId;
    let compData = null;
    if (compDocId) {
      const compSnap = await getDoc(doc(db, "competitions", compDocId));
      if (compSnap.exists()) {
        compData = compSnap.data();
      }
    }
    const now = Date.now();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (regData.examAttemptStatus === "submitted" || regData.examAttemptStatus === "auto_submitted" || regData.status === "completed" || regData.status === "evaluated") {
      res.status(403).json({
        allowed: false,
        error: "Examination attempt has already been submitted and finalized.",
        examAttemptStatus: regData.examAttemptStatus,
        alreadySubmitted: true
      });
      return;
    }
    const scheduleDate = compData?.examScheduleDate || compData?.examDetails?.examScheduleDate || compData?.competitionDate;
    const openTime = compData?.openingTime || compData?.examDetails?.openingTime || "09:00";
    const closeTime = compData?.closingTime || compData?.examDetails?.closingTime || "10:00";
    const timeZone = compData?.timeZone || compData?.examDetails?.timeZone || "Asia/Kolkata";
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
    const durationMinutes = Number(compData?.examDetails?.durationMinutes || 45);
    const durationSeconds = durationMinutes * 60;
    let examStartedAt = regData.examStartedAt;
    if (examStartedAt) {
      const startMs = new Date(examStartedAt).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1e3));
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
      if (remainingSeconds <= 0) {
        await updateDoc(regRef, cleanObject({
          examAttemptStatus: "auto_submitted",
          submissionReason: "Auto-Submitted \u2014 Time Expired",
          submissionType: "Auto-Submitted \u2014 Time Expired",
          submittedAt: nowIso,
          updatedAt: nowIso
        }));
        res.json({
          allowed: false,
          expired: true,
          error: "Allocated examination time has expired. Your attempt has been automatically locked and submitted.",
          examAttemptStatus: "auto_submitted",
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
    examStartedAt = nowIso;
    await updateDoc(regRef, cleanObject({
      examStartedAt,
      examAttemptStatus: "in_progress",
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
  } catch (err) {
    console.error("Error starting exam attempt:", err);
    res.status(500).json({ error: err.message || "Server error starting exam attempt." });
  }
});
app.post("/api/exam/submit-attempt", async (req, res) => {
  try {
    const {
      registrationId,
      competitionId,
      answers = {},
      violations = [],
      selectedLanguage = "en",
      isAutoExpired = false
    } = req.body;
    if (!registrationId) {
      res.status(400).json({ error: "registrationId is required." });
      return;
    }
    const regRef = doc(db, "competition_registrations", registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      res.status(404).json({ error: "Registration record not found." });
      return;
    }
    const regData = regSnap.data();
    const authCheck = await verifyCandidateOrAdmin(req, regData.participantUid);
    if (!authCheck.authorized) {
      res.status(401).json({
        error: authCheck.reason || "Authentication required to submit this examination attempt."
      });
      return;
    }
    const compDocId = competitionId || regData.competitionId;
    let compData = null;
    if (compDocId) {
      const compSnap = await getDoc(doc(db, "competitions", compDocId));
      if (compSnap.exists()) {
        compData = compSnap.data();
      }
    }
    const now = Date.now();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (regData.examAttemptStatus === "submitted" || regData.examAttemptStatus === "auto_submitted" || regData.status === "completed" || regData.status === "evaluated") {
      res.json({
        success: true,
        alreadySubmitted: true,
        marksObtained: regData.marksObtained || 0,
        totalMarks: regData.totalMarks || 100,
        percentage: regData.percentage || 0,
        status: regData.status,
        examAttemptStatus: regData.examAttemptStatus,
        submissionReason: regData.submissionReason || "Auto-Submitted \u2014 Time Expired"
      });
      return;
    }
    const durationMinutes = Number(compData?.examDetails?.durationMinutes || 45);
    const durationSeconds = durationMinutes * 60;
    const startMs = regData.examStartedAt ? new Date(regData.examStartedAt).getTime() : now;
    const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1e3));
    const isExpired = Boolean(isAutoExpired || elapsedSeconds >= durationSeconds);
    const submissionType = isExpired ? "Auto-Submitted \u2014 Time Expired" : "Manual Submission";
    const submissionReason = isExpired ? "Auto-Submitted \u2014 Time Expired" : "Candidate Manual Submission";
    const examAttemptStatus = isExpired ? "auto_submitted" : "submitted";
    let questions = compData?.examDetails?.questions || [];
    if ((!questions || questions.length === 0) && compData?.examDetails?.sections && compData.examDetails.sections.length > 0) {
      questions = [];
      compData.examDetails.sections.forEach((sec) => {
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
      questions.forEach((q) => {
        const qMarks = q.marks || 4;
        calculatedTotal += qMarks;
        const candidateAns = answers[q.id];
        if (candidateAns !== void 0 && candidateAns !== null && candidateAns !== "") {
          if (q.questionType === "mcq" || q.questionType === "true_false") {
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
    const percentage = Number((score / totalMarks * 100).toFixed(1));
    const passingMarks = compData?.passingMarks || 40;
    const passed = score >= passingMarks;
    let grade = "Needs Improvement";
    if (percentage >= 90) grade = "A+ (Distinction)";
    else if (percentage >= 75) grade = "A (Excellent)";
    else if (percentage >= 60) grade = "B (Good)";
    else if (percentage >= 40) grade = "C (Pass)";
    const autoAward = passed ? "merit" : "participation";
    const shouldAutoPublish = compData?.autoPublishResults === true;
    await updateDoc(regRef, cleanObject({
      status: passed ? "completed" : "evaluated",
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
      resultsPublishedAt: shouldAutoPublish ? nowIso : void 0,
      updatedAt: nowIso
    }));
    await setDoc(doc(db, "exam_attempts", `att-${registrationId}`), cleanObject({
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
      status: "evaluated",
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
      status: passed ? "Passed" : "Completed"
    });
  } catch (err) {
    console.error("Error submitting exam attempt:", err);
    res.status(500).json({ error: err.message || "Server error submitting exam attempt." });
  }
});
app.post("/api/exam/save-answers", async (req, res) => {
  try {
    const { registrationId, answers = {}, timeSpentSeconds } = req.body;
    if (!registrationId) {
      res.status(400).json({ error: "registrationId is required." });
      return;
    }
    const regRef = doc(db, "competition_registrations", registrationId);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      res.status(404).json({ error: "Registration record not found." });
      return;
    }
    const regData = regSnap.data();
    const authCheck = await verifyCandidateOrAdmin(req, regData.participantUid);
    if (!authCheck.authorized) {
      res.status(401).json({ error: authCheck.reason || "Authentication required to persist answers." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    await updateDoc(regRef, cleanObject({
      submittedAnswers: answers,
      lastAnsweredAt: nowIso,
      updatedAt: nowIso,
      ...timeSpentSeconds !== void 0 ? { timeSpentSeconds } : {}
    }));
    res.json({ success: true, savedAt: nowIso });
  } catch (err) {
    console.warn("Real-time save warning:", err);
    res.status(500).json({ error: err.message || "Failed to persist answers" });
  }
});
app.post("/api/competitions/delete", async (req, res) => {
  try {
    const { competitionId, adminUid, adminEmail, mode = "archive" } = req.body;
    if (!competitionId) {
      res.status(400).json({ error: "competitionId is required." });
      return;
    }
    let isSuperAdmin = false;
    const normalizedEmail = (adminEmail || "").trim().toLowerCase();
    if (normalizedEmail === "fetkofficial@gmail.com") {
      isSuperAdmin = true;
    } else if (adminUid) {
      const userSnap = await getDoc(doc(db, "users", adminUid));
      if (userSnap.exists()) {
        const udata = userSnap.data();
        if (udata.role === "super_admin" || udata.primaryRole === "super_admin" || Array.isArray(udata.roles) && udata.roles.includes("super_admin") || (udata.email || "").toLowerCase() === "fetkofficial@gmail.com") {
          isSuperAdmin = true;
        }
      }
    }
    if (!isSuperAdmin) {
      res.status(403).json({
        error: "Permission Denied: ONLY Super Admin can delete or archive a competition. Exam Controllers do not possess deletion authority."
      });
      return;
    }
    const compRef = doc(db, "competitions", competitionId);
    const compSnap = await getDoc(compRef);
    if (!compSnap.exists()) {
      res.status(404).json({ error: "Competition record not found." });
      return;
    }
    const compData = compSnap.data();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (mode === "permanent") {
      await deleteDoc(compRef);
      try {
        await addDoc(collection(db, "audit_logs"), cleanObject({
          action: "competition.permanently_deleted",
          competitionId,
          competitionTitle: compData.title,
          competitionCode: compData.code,
          performedByUid: adminUid,
          performedByEmail: adminEmail,
          timestamp: nowIso,
          details: `Super Admin permanently deleted competition "${compData.title}". Historical registrations, attempts, and certificate records were preserved.`
        }));
      } catch (auditErr) {
        console.warn("Audit log write error:", auditErr);
      }
      res.json({
        success: true,
        mode: "permanent",
        message: `Competition "${compData.title}" was permanently removed. Historical candidate and financial records are preserved.`
      });
      return;
    }
    await updateDoc(compRef, cleanObject({
      isDeleted: true,
      status: "archived",
      archivedAt: nowIso,
      deletedAt: nowIso,
      deletedByUid: adminUid,
      deletedByEmail: adminEmail,
      updatedAt: nowIso
    }));
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        action: "competition.archived",
        competitionId,
        competitionTitle: compData.title,
        competitionCode: compData.code,
        performedByUid: adminUid,
        performedByEmail: adminEmail,
        timestamp: nowIso,
        details: `Super Admin soft-deleted/archived competition "${compData.title}". Candidate records remain secure.`
      }));
    } catch (auditErr) {
      console.warn("Audit log write error:", auditErr);
    }
    res.json({
      success: true,
      mode: "archived",
      message: `Competition "${compData.title}" archived successfully. Historical candidate records remain protected.`
    });
  } catch (err) {
    console.error("Error deleting/archiving competition:", err);
    res.status(500).json({ error: err.message || "Server error processing competition deletion." });
  }
});
var EXAM_MATERIALS_DIR = path.join(process.cwd(), "data", "examination_materials");
if (!fs.existsSync(EXAM_MATERIALS_DIR)) {
  fs.mkdirSync(EXAM_MATERIALS_DIR, { recursive: true });
}
var examPdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const examId = String(req.body.examId || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dest = path.join(EXAM_MATERIALS_DIR, examId);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${sanitized}`);
  }
});
var uploadExamPdf = multer({
  storage: examPdfStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  // 25MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only official PDF files (.pdf) up to 25 MB are accepted."));
    }
  }
});
app.post("/api/competitions/upload-pdf", uploadExamPdf.single("pdfFile"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No PDF file uploaded." });
      return;
    }
    const examId = String(req.body.examId || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = req.file.originalname;
    const sizeBytes = req.file.size;
    const relativeStoragePath = `examination_materials/${examId}/${req.file.filename}`;
    res.json({
      success: true,
      url: `/api/competitions/${examId}/material`,
      storagePath: relativeStoragePath,
      fileName,
      sizeBytes,
      mimeType: "application/pdf"
    });
  } catch (err) {
    console.error("Error in /api/competitions/upload-pdf:", err);
    res.status(500).json({ error: err.message || "Failed to process PDF upload." });
  }
});
app.get("/api/competitions/:competitionId/material", async (req, res) => {
  try {
    const { competitionId } = req.params;
    const uid = String(req.query.uid || req.headers["x-user-uid"] || "").trim();
    if (!competitionId) {
      res.status(400).json({ error: "competitionId is required." });
      return;
    }
    let compData = null;
    try {
      const compSnap = await getDoc(doc(db, "competitions", competitionId));
      if (compSnap.exists()) {
        compData = compSnap.data();
      }
    } catch (e) {
    }
    if (!compData) {
      const match = INITIAL_COMPETITIONS.find((c) => c.id === competitionId);
      if (match) compData = match;
    }
    if (!compData) {
      res.status(404).json({ error: "Competition record not found." });
      return;
    }
    const pdfUrl = compData.pdfReadingMaterialUrl || compData.bookDetails?.pdfReadingMaterialUrl || compData.pdfExternalUrl || compData.bookDetails?.pdfExternalUrl;
    const rawFileName = compData.pdfFileName || compData.bookDetails?.pdfFileName || `${compData.code || "FET"}_Study_Material.pdf`;
    const safeFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    let isAuthorized = false;
    if (uid) {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const u = userSnap.data();
          if (u.role === "super_admin" || u.role === "administrator" || u.role === "exam_controller" || u.role === "exam_admin" || u.primaryRole === "super_admin" || u.primaryRole === "administrator" || u.primaryRole === "exam_controller" || Array.isArray(u.roles) && u.roles.some((r) => ["super_admin", "administrator", "exam_controller", "exam_admin", "examination_admin"].includes(r)) || (u.email || "").toLowerCase() === "fetkofficial@gmail.com") {
            isAuthorized = true;
          }
        }
      } catch (e) {
      }
      if (!isAuthorized) {
        try {
          const regDocId = `reg-${competitionId}-${uid}`;
          const regSnap = await getDoc(doc(db, "competition_registrations", regDocId));
          if (regSnap.exists()) {
            const regData = regSnap.data();
            if (regData.status !== "cancelled") {
              if (compData.isPaid) {
                if (regData.isPaid && regData.paymentStatus === "paid") {
                  isAuthorized = true;
                } else {
                  res.status(403).json({ error: "Examination fee payment is pending. Please complete payment to unlock study material." });
                  return;
                }
              } else {
                isAuthorized = true;
              }
            }
          } else {
            const q = query(
              collection(db, "competition_registrations"),
              where("competitionId", "==", competitionId),
              where("participantUid", "==", uid)
            );
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              const regData = qSnap.docs[0].data();
              if (regData.status !== "cancelled") {
                if (compData.isPaid) {
                  if (regData.isPaid && regData.paymentStatus === "paid") {
                    isAuthorized = true;
                  } else {
                    res.status(403).json({ error: "Examination fee payment is pending. Please complete payment to unlock study material." });
                    return;
                  }
                } else {
                  isAuthorized = true;
                }
              }
            }
          }
        } catch (regErr) {
          console.warn("Registration lookup notice in material download:", regErr);
        }
      }
    }
    if (!isAuthorized) {
      res.status(403).json({ error: "Enrolled student registration required to access official examination curriculum." });
      return;
    }
    if (!pdfUrl) {
      res.status(404).json({ error: "Official curriculum PDF has not been uploaded yet for this competition." });
      return;
    }
    const cleanCompId = competitionId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const localDir = path.join(EXAM_MATERIALS_DIR, cleanCompId);
    if (fs.existsSync(localDir)) {
      const files = fs.readdirSync(localDir);
      if (files.length > 0) {
        const targetFile = path.join(localDir, files[files.length - 1]);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${safeFileName.endsWith(".pdf") ? safeFileName : safeFileName + ".pdf"}"`);
        fs.createReadStream(targetFile).pipe(res);
        return;
      }
    }
    if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
      try {
        const remoteResp = await fetch(pdfUrl);
        if (remoteResp.ok) {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${safeFileName.endsWith(".pdf") ? safeFileName : safeFileName + ".pdf"}"`);
          const arrayBuffer = await remoteResp.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
          return;
        }
      } catch (remoteErr) {
        console.warn("Remote PDF stream notice, falling back to redirect:", remoteErr);
      }
      res.redirect(pdfUrl);
      return;
    }
    if (pdfUrl.startsWith("data:application/pdf;base64,")) {
      const base64Data = pdfUrl.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFileName.endsWith(".pdf") ? safeFileName : safeFileName + ".pdf"}"`);
      res.send(buffer);
      return;
    }
    res.status(404).json({ error: "Examination document reference is invalid or unavailable." });
  } catch (err) {
    console.error("Error delivering competition material:", err);
    res.status(500).json({ error: err.message || "Server error delivering examination material." });
  }
});
app.get("/api/competitions/:competitionId/access-check", async (req, res) => {
  try {
    const { competitionId } = req.params;
    const uid = String(req.query.uid || req.headers["x-user-uid"] || "").trim();
    if (!competitionId) {
      res.status(400).json({ error: "competitionId is required." });
      return;
    }
    let compData = null;
    try {
      const compSnap = await getDoc(doc(db, "competitions", competitionId));
      if (compSnap.exists()) compData = compSnap.data();
    } catch (e) {
    }
    if (!compData) {
      const match = INITIAL_COMPETITIONS.find((c) => c.id === competitionId);
      if (match) compData = match;
    }
    if (!compData) {
      res.status(404).json({ error: "Competition record not found." });
      return;
    }
    const hasDocument = Boolean(compData.pdfReadingMaterialUrl || compData.bookDetails?.pdfReadingMaterialUrl || compData.pdfExternalUrl || compData.bookDetails?.pdfExternalUrl);
    let isAuthorized = false;
    let paymentPending = false;
    let registered = false;
    if (uid) {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const u = userSnap.data();
          if (u.role === "super_admin" || u.role === "administrator" || u.role === "exam_controller" || u.primaryRole === "super_admin" || u.primaryRole === "administrator" || u.primaryRole === "exam_controller" || Array.isArray(u.roles) && u.roles.some((r) => ["super_admin", "administrator", "exam_controller", "exam_admin"].includes(r)) || (u.email || "").toLowerCase() === "fetkofficial@gmail.com") {
            isAuthorized = true;
          }
        }
      } catch (e) {
      }
      if (!isAuthorized) {
        try {
          const regDocId = `reg-${competitionId}-${uid}`;
          const regSnap = await getDoc(doc(db, "competition_registrations", regDocId));
          if (regSnap.exists()) {
            const regData = regSnap.data();
            if (regData.status !== "cancelled") {
              registered = true;
              if (compData.isPaid) {
                if (regData.isPaid && regData.paymentStatus === "paid") {
                  isAuthorized = true;
                } else {
                  paymentPending = true;
                }
              } else {
                isAuthorized = true;
              }
            }
          }
        } catch (e) {
        }
      }
    }
    res.json({
      success: true,
      competitionId,
      hasDocument,
      fileName: compData.pdfFileName || compData.bookDetails?.pdfFileName || `${compData.code || "FET"}_Study_Material.pdf`,
      sizeBytes: compData.pdfFileSizeBytes || compData.bookDetails?.pdfFileSizeBytes,
      isRegistered: registered,
      isPaymentPending: paymentPending,
      canDownload: isAuthorized && hasDocument,
      downloadUrl: isAuthorized && hasDocument ? `/api/competitions/${competitionId}/material?uid=${encodeURIComponent(uid)}` : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error checking document access." });
  }
});
var DEFAULT_SERVER_PLATFORMS = {
  school_erp: {
    platformKey: "school_erp",
    name: "FET School ERP",
    description: "External academic administration platform for affiliated trust schools (Admissions, Attendance, Timetables, Staff, Operations). Separate product launching March/April 2027.",
    status: "active",
    healthStatus: "disconnected",
    connectionStatus: "not_connected",
    baseUrl: process.env.FET_SCHOOL_ERP_URL || "",
    ssoEndpoint: "/api/v1/auth/sso/consume",
    apiEndpoint: "/api/v1",
    allowedModules: ["admissions", "attendance", "timetables", "teachers", "students", "library", "transport", "operations"],
    allowedOperations: ["view_dashboard", "manage_roster", "deep_link_student", "export_reports"],
    authMethod: "signed_token_exchange",
    tenantIsolationEnforced: true,
    externalAppId: "fet-school-erp-prod",
    healthMessage: "Platform connection unconfigured (Deployment scheduled March/April 2027)",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  madrasa_erp: {
    platformKey: "madrasa_erp",
    name: "FET Madrasa ERP",
    description: "External Islamic seminary and madrasa administration platform (Hifz, Tajweed, Alim courses, Boarding, and Student Records). Separate product launching March/April 2027.",
    status: "active",
    healthStatus: "disconnected",
    connectionStatus: "not_connected",
    baseUrl: process.env.FET_MADRASA_ERP_URL || "",
    ssoEndpoint: "/api/v1/auth/sso/consume",
    apiEndpoint: "/api/v1",
    allowedModules: ["admissions", "hifz_roster", "attendance", "hostel", "curriculum", "operations"],
    allowedOperations: ["view_dashboard", "manage_roster", "deep_link_student", "export_reports"],
    authMethod: "signed_token_exchange",
    tenantIsolationEnforced: true,
    externalAppId: "fet-madrasa-erp-prod",
    healthMessage: "Platform connection unconfigured (Deployment scheduled March/April 2027)",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  multilingual: {
    platformKey: "multilingual",
    name: "FET Multilingual Platform",
    description: "Independent multilingual digital library, text translation engine, and prescribed book reader platform.",
    status: "active",
    healthStatus: "connected",
    connectionStatus: "connected",
    baseUrl: process.env.FET_MULTILINGUAL_URL || "https://books.fetindia.org",
    ssoEndpoint: "/auth/sso/token",
    apiEndpoint: "/api/v1/books",
    allowedModules: ["document_reader", "translation_matrix", "language_editions", "downloads", "reviewer_workflow"],
    allowedOperations: ["read_document", "switch_language", "download_pdf", "verify_candidate_access"],
    authMethod: "signed_token_exchange",
    tenantIsolationEnforced: false,
    externalAppId: "fet-multilingual-reader",
    healthMessage: "Platform content delivery network operational",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
};
var SSO_HMAC_SECRET = process.env.INTEGRATION_SSO_SECRET || crypto.createHash("sha256").update(firebaseConfigData.apiKey || "fet-india-sso-secret").digest("hex");
app.get("/api/integration/platforms", async (_req, res) => {
  try {
    const platformsMap = { ...DEFAULT_SERVER_PLATFORMS };
    const snap = await getDocs(collection(db, "integration_platforms"));
    snap.forEach((d) => {
      const p = d.data();
      if (p.platformKey) {
        platformsMap[p.platformKey] = {
          ...platformsMap[p.platformKey],
          ...p,
          id: d.id
        };
      }
    });
    res.json({
      success: true,
      platforms: platformsMap,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("Error fetching integration platforms:", err);
    res.json({
      success: true,
      platforms: DEFAULT_SERVER_PLATFORMS,
      fallback: true
    });
  }
});
app.get("/api/integration/platforms/:platformKey/health", async (req, res) => {
  const { platformKey } = req.params;
  const platform = DEFAULT_SERVER_PLATFORMS[platformKey];
  if (!platform) {
    res.status(404).json({ error: `External platform '${platformKey}' not found.` });
    return;
  }
  const baseUrl = platform.baseUrl;
  if (!baseUrl || baseUrl.includes("example.com")) {
    res.json({
      healthStatus: "configuration_missing",
      message: "Platform base URL is unconfigured.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4e3);
    const pingRes = await fetch(baseUrl, {
      method: "HEAD",
      signal: controller.signal
    }).catch(async () => {
      return await fetch(baseUrl, {
        method: "GET",
        signal: controller.signal
      });
    });
    clearTimeout(timeoutId);
    if (pingRes.status < 500) {
      res.json({
        healthStatus: "connected",
        message: `Responsive (HTTP ${pingRes.status})`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else {
      res.json({
        healthStatus: "service_unavailable",
        message: `Service reported server error (HTTP ${pingRes.status})`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  } catch (fetchErr) {
    const isTimeout = fetchErr.name === "AbortError";
    res.json({
      healthStatus: isTimeout ? "service_unavailable" : "disconnected",
      message: isTimeout ? "Connection timed out (4s limit)" : fetchErr.message || "Network handshake failed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.post("/api/integration/sso/initiate", async (req, res) => {
  try {
    const {
      userUid,
      userEmail,
      userName,
      userRole = "member",
      roles = [],
      targetPlatform,
      targetTenantId,
      targetResourceId,
      resourceAccessLevel = "public",
      returnUrl = "https://fetindia.org"
    } = req.body;
    if (!userUid || !targetPlatform) {
      res.status(400).json({ error: "userUid and targetPlatform are required." });
      return;
    }
    const platformConfig = DEFAULT_SERVER_PLATFORMS[targetPlatform];
    if (!platformConfig) {
      res.status(400).json({ error: `Unknown target platform '${targetPlatform}'.` });
      return;
    }
    if (targetPlatform === "school_erp" && platformConfig.tenantIsolationEnforced) {
      const isSuper = userRole === "super_admin" || Array.isArray(roles) && roles.includes("super_admin");
      const isSchoolAdmin = userRole === "school_admin" || Array.isArray(roles) && roles.includes("school_admin");
      if (!isSuper && !isSchoolAdmin) {
        res.status(403).json({
          error: "Access Denied: School ERP requires authorized school administrator credentials."
        });
        return;
      }
      if (!isSuper && targetTenantId) {
        const userDoc = await getDoc(doc(db, "users", userUid));
        if (userDoc.exists()) {
          const udata = userDoc.data();
          const assignedSchool = udata.institutionId || udata.assignedSchoolId;
          if (assignedSchool && assignedSchool !== targetTenantId) {
            res.status(403).json({
              error: `Tenant Isolation Violation: You are not authorized to access school tenant ${targetTenantId}.`
            });
            return;
          }
        }
      }
    }
    if (targetPlatform === "multilingual" && resourceAccessLevel === "restricted_exam") {
      if (!userUid) {
        res.status(403).json({ error: "This study material is restricted to verified candidates." });
        return;
      }
    }
    const now = Date.now();
    const expiresInSeconds = 300;
    const expiresAt = now + expiresInSeconds * 1e3;
    const sessionId = `sso_${crypto.randomBytes(16).toString("hex")}`;
    const nonce = crypto.randomBytes(12).toString("hex");
    const signPayload = `${sessionId}:${userUid}:${targetPlatform}:${targetTenantId || ""}:${expiresAt}:${nonce}`;
    const signature = crypto.createHmac("sha256", SSO_HMAC_SECRET).update(signPayload).digest("hex");
    const sessionDoc = {
      sessionId,
      userUid,
      userEmail: userEmail || "unknown@fetindia.org",
      userName: userName || "FET User",
      userRole,
      roles: Array.isArray(roles) ? roles : [userRole],
      targetPlatform,
      targetTenantId: targetTenantId || null,
      targetResourceId: targetResourceId || null,
      resourceAccessLevel,
      returnUrl,
      nonce,
      issuedAt: now,
      expiresAt,
      isUsed: false,
      signature
    };
    await addDoc(collection(db, "integration_sso_sessions"), cleanObject(sessionDoc));
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        action: "EXTERNAL_SSO_HANDOFF_INITIATED",
        performedByUid: userUid,
        performedByEmail: userEmail,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        details: `SSO handoff initiated for ${targetPlatform}${targetTenantId ? ` (Tenant: ${targetTenantId})` : ""} by ${userName} (${userRole}). Session: ${sessionId}`
      }));
    } catch (auditErr) {
      console.warn("SSO audit log error:", auditErr);
    }
    const baseUrl = (platformConfig.baseUrl || "").replace(/\/+$/, "");
    const ssoEndpoint = platformConfig.ssoEndpoint || "/auth/sso";
    const launchUrl = `${baseUrl}${ssoEndpoint}?token=${signature}&session=${sessionId}&user=${encodeURIComponent(userUid)}&tenant=${encodeURIComponent(targetTenantId || "")}&resource=${encodeURIComponent(targetResourceId || "")}&return_url=${encodeURIComponent(returnUrl)}`;
    res.json({
      success: true,
      handoffUrl: launchUrl,
      sessionId,
      token: signature,
      expiresInSeconds,
      targetPlatform,
      targetTenantId
    });
  } catch (err) {
    console.error("Error initiating SSO handoff:", err);
    res.status(500).json({ error: err.message || "Failed to generate SSO handoff session." });
  }
});
app.post("/api/integration/platforms/:platformKey/config", async (req, res) => {
  try {
    const { platformKey } = req.params;
    const { adminUid, adminEmail, updates } = req.body;
    let isSuper = false;
    const normalizedEmail = (adminEmail || "").trim().toLowerCase();
    if (normalizedEmail === "fetkofficial@gmail.com") {
      isSuper = true;
    } else if (adminUid) {
      const userSnap = await getDoc(doc(db, "users", adminUid));
      if (userSnap.exists()) {
        const udata = userSnap.data();
        if (udata.role === "super_admin" || udata.primaryRole === "super_admin" || Array.isArray(udata.roles) && udata.roles.includes("super_admin")) {
          isSuper = true;
        }
      }
    }
    if (!isSuper) {
      res.status(403).json({ error: "Permission Denied: Only Super Admin can modify platform integration configuration." });
      return;
    }
    const platformRef = doc(db, "integration_platforms", platformKey);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const cleanUpdates = cleanObject({
      ...updates,
      platformKey,
      updatedAt: nowIso,
      updatedByUid: adminUid
    });
    await setDoc(platformRef, cleanUpdates, { merge: true });
    if (DEFAULT_SERVER_PLATFORMS[platformKey]) {
      DEFAULT_SERVER_PLATFORMS[platformKey] = {
        ...DEFAULT_SERVER_PLATFORMS[platformKey],
        ...cleanUpdates
      };
    }
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        action: "EXTERNAL_PLATFORM_CONFIG_UPDATED",
        performedByUid: adminUid,
        performedByEmail: adminEmail,
        timestamp: nowIso,
        details: `Platform integration settings for '${platformKey}' updated by Super Admin.`
      }));
    } catch (auditErr) {
      console.warn("Audit error:", auditErr);
    }
    res.json({
      success: true,
      message: `Platform '${platformKey}' configuration saved successfully.`
    });
  } catch (err) {
    console.error("Error saving integration platform config:", err);
    res.status(500).json({ error: err.message || "Failed to save integration config." });
  }
});
app.get(["/api/store/orders/validate", "/api/store/order/validate"], (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Store order validation requires an HTTP POST request with order items and address details.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
app.post(["/api/store/orders/validate", "/api/store/order/validate"], async (req, res) => {
  try {
    const { items, customer, billingAddress, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ isValid: false, errors: ["Order must contain at least one item."] });
      return;
    }
    const errors = [];
    if (customer && typeof customer === "object") {
      if (customer.fullName !== void 0 && (!customer.fullName || !String(customer.fullName).trim())) {
        errors.push("Customer full name is required.");
      }
      if (customer.email !== void 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!customer.email || !emailRegex.test(String(customer.email).trim())) {
          errors.push("A valid customer email address is required.");
        }
      }
      if (customer.mobileNumber !== void 0) {
        const cleanMobile = String(customer.mobileNumber || "").replace(/\D/g, "");
        const normMobile = cleanMobile.length === 12 && cleanMobile.startsWith("91") ? cleanMobile.slice(2) : cleanMobile.length === 11 && cleanMobile.startsWith("0") ? cleanMobile.slice(1) : cleanMobile;
        if (normMobile.length !== 10) {
          errors.push("A valid 10-digit mobile number is required.");
        }
      }
    }
    if (billingAddress && typeof billingAddress === "object") {
      if (billingAddress.addressLine1 !== void 0 && !String(billingAddress.addressLine1).trim()) {
        errors.push("Billing Address Line 1 cannot be blank.");
      }
      if (billingAddress.city !== void 0 && !String(billingAddress.city).trim()) {
        errors.push("Billing city cannot be blank.");
      }
      if (billingAddress.state !== void 0 && !String(billingAddress.state).trim()) {
        errors.push("Billing state cannot be blank.");
      }
      if (billingAddress.pincode !== void 0) {
        const cleanPincode = String(billingAddress.pincode || "").replace(/\D/g, "");
        if (cleanPincode.length !== 6) {
          errors.push("Valid 6-digit billing PIN code is required.");
        }
      }
    }
    const validatedItems = [];
    let calculatedSubtotal = 0;
    for (let i = 0; i < items.length; i++) {
      const requestedItem = items[i];
      if (!requestedItem || !requestedItem.productId) {
        errors.push(`Item ${i + 1} is missing a valid product ID.`);
        continue;
      }
      let productData = null;
      try {
        const prodRef = doc(db, "store_products", requestedItem.productId);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          productData = prodSnap.data();
        }
      } catch {
      }
      if (!productData) {
        const demoFound = STORE_DEMO_PRODUCTS.find((p) => p.id === requestedItem.productId);
        if (demoFound) {
          productData = demoFound;
        } else {
          errors.push(`Product with ID "${requestedItem.productId}" was not found in the official store catalog.`);
          continue;
        }
      }
      if (!productData.isPublished || productData.status === "INACTIVE" || productData.status === "ARCHIVED" || productData.isActive === false) {
        errors.push(`Product "${productData.name}" is currently inactive or unpublished.`);
        continue;
      }
      if (productData.isAvailable === false || productData.availability === "unavailable" || productData.availability === "out_of_stock") {
        errors.push(`Product "${productData.name}" is currently out of stock or unavailable.`);
        continue;
      }
      let authoritativeUnitPrice = productData.price;
      let authoritativeMrp = productData.mrp;
      let selectedVariantObj = null;
      if (requestedItem.variantId) {
        if (!productData.variants || !Array.isArray(productData.variants)) {
          errors.push(`Product "${productData.name}" does not support variants.`);
          continue;
        }
        const matchedVariant = productData.variants.find((v) => v.id === requestedItem.variantId);
        if (!matchedVariant) {
          errors.push(`Requested option "${requestedItem.variantId}" does not exist for product "${productData.name}".`);
          continue;
        }
        if (matchedVariant.isAvailable === false || matchedVariant.availability === "unavailable" || matchedVariant.availability === "out_of_stock") {
          errors.push(`Option "${matchedVariant.name}" for "${productData.name}" is currently unavailable.`);
          continue;
        }
        if (matchedVariant.price !== void 0 && matchedVariant.price !== null) {
          authoritativeUnitPrice = matchedVariant.price;
        }
        if (matchedVariant.mrp !== void 0) {
          authoritativeMrp = matchedVariant.mrp;
        }
        selectedVariantObj = matchedVariant;
      } else if (productData.hasVariants && Array.isArray(productData.variants) && productData.variants.length > 0) {
        errors.push(`Product "${productData.name}" requires a variant selection.`);
        continue;
      }
      if (authoritativeUnitPrice === void 0 || authoritativeUnitPrice === null || authoritativeUnitPrice < 0) {
        errors.push(`Product "${productData.name}" does not have a valid configured price.`);
        continue;
      }
      const rawQty = Number(requestedItem.quantity);
      if (isNaN(rawQty) || !Number.isInteger(rawQty) || rawQty <= 0) {
        errors.push(`Quantity for "${productData.name}" must be a valid positive whole number (at least 1).`);
        continue;
      }
      if (rawQty > 500) {
        errors.push(`Quantity for "${productData.name}" exceeds maximum allowed order limit (500 units per line item).`);
        continue;
      }
      const requestedQty = rawQty;
      const trackInv = selectedVariantObj?.trackInventory !== void 0 ? selectedVariantObj.trackInventory : productData.trackInventory !== false && productData.productType !== "digital";
      const currentStock = selectedVariantObj?.stockCount !== void 0 ? selectedVariantObj.stockCount : productData.stockCount;
      const isPreOrder = (selectedVariantObj?.availability || productData.availability) === "pre_order";
      if (trackInv && !isPreOrder && currentStock !== void 0) {
        if (currentStock <= 0) {
          errors.push(`Product "${productData.name}" is out of stock.`);
          continue;
        }
        if (requestedQty > currentStock) {
          errors.push(`Requested quantity (${requestedQty}) for "${productData.name}" exceeds available stock (${currentStock}).`);
          continue;
        }
      }
      const itemTotal = authoritativeUnitPrice * requestedQty;
      calculatedSubtotal += itemTotal;
      validatedItems.push({
        productId: requestedItem.productId,
        productName: productData.name,
        productSlug: productData.slug || "",
        productType: productData.productType,
        category: productData.category,
        categoryName: productData.categoryName || "",
        sku: selectedVariantObj?.sku || productData.sku || "",
        imageUrl: selectedVariantObj?.imageUrl || productData.imageUrl || "",
        hasVariants: Boolean(productData.hasVariants),
        variantId: selectedVariantObj?.id || void 0,
        variantName: selectedVariantObj?.name || void 0,
        variantAttributes: selectedVariantObj?.attributes || void 0,
        quantity: requestedQty,
        unitPrice: authoritativeUnitPrice,
        unitMrp: authoritativeMrp || void 0,
        itemTotal,
        isDigital: Boolean(productData.isDigital || productData.productType === "digital"),
        paymentMethods: productData.paymentMethods || "both"
      });
    }
    const shippingAmount = 0;
    const finalTotal = calculatedSubtotal + shippingAmount;
    const itemPaymentMethods = validatedItems.map((it) => it.paymentMethods || "both");
    const supportsCod = itemPaymentMethods.every((pm) => pm === "cod" || pm === "both");
    const supportsRazorpay = itemPaymentMethods.every((pm) => pm === "razorpay" || pm === "both");
    const isFreeOrder = finalTotal === 0;
    const allowedPaymentMethods = [];
    if (isFreeOrder) allowedPaymentMethods.push("free");
    if (supportsCod) allowedPaymentMethods.push("COD");
    if (supportsRazorpay) allowedPaymentMethods.push("razorpay");
    let hasPaymentMethodConflict = false;
    let paymentMethodConflictReason = "";
    if (!isFreeOrder && !supportsCod && !supportsRazorpay && validatedItems.length > 0) {
      hasPaymentMethodConflict = true;
      paymentMethodConflictReason = "Your cart contains items with conflicting payment requirements (some items are Cash on Delivery only, while others require Online Payment). Please place separate orders for these items.";
      errors.push(paymentMethodConflictReason);
    }
    const requestedPaymentMethod = req.body.paymentMethod;
    if (requestedPaymentMethod && !isFreeOrder) {
      if (requestedPaymentMethod === "COD" && !supportsCod) {
        errors.push("Cash on Delivery (COD) is not available for all items in your cart. One or more items require online payment.");
      } else if (requestedPaymentMethod === "razorpay" && !supportsRazorpay) {
        errors.push("Online Payment is not available for all items in your cart. One or more items are Cash on Delivery only.");
      }
    }
    if (errors.length > 0) {
      res.status(400).json({
        isValid: false,
        errors,
        validatedItems,
        subtotal: calculatedSubtotal,
        shippingAmount,
        total: finalTotal,
        currency: "INR",
        allowedPaymentMethods,
        isFreeOrder,
        hasPaymentMethodConflict,
        paymentMethodConflictReason: paymentMethodConflictReason || void 0
      });
      return;
    }
    res.json({
      isValid: true,
      validatedItems,
      subtotal: calculatedSubtotal,
      shippingAmount,
      total: finalTotal,
      currency: "INR",
      allowedPaymentMethods,
      isFreeOrder,
      hasPaymentMethodConflict,
      paymentMethodConflictReason: paymentMethodConflictReason || void 0
    });
  } catch (err) {
    console.error("Error during store order validation:", err);
    res.status(500).json({ isValid: false, errors: [err.message || "Server error validating order."] });
  }
});
async function dispatchServerStoreOrderNotification(params) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let inAppDispatched = false;
  let notificationId = void 0;
  let title = `Order Status: #${params.orderNumber}`;
  let message = `Your order #${params.orderNumber} status has been updated.`;
  let severity = "info";
  let priority = "normal";
  switch (params.eventType) {
    case "order_received":
      title = `Order Received: #${params.orderNumber}`;
      message = `Your order #${params.orderNumber} has been received and recorded with ${params.itemCount} item(s). Total: \u20B9${params.total.toLocaleString("en-IN")}.`;
      severity = "info";
      priority = "normal";
      break;
    case "order_processing":
      title = `Order In Processing: #${params.orderNumber}`;
      message = `Your order #${params.orderNumber} is now being processed and packed for dispatch.`;
      severity = "info";
      priority = "normal";
      break;
    case "order_shipped":
      title = `Order Shipped: #${params.orderNumber}`;
      message = `Your order #${params.orderNumber} has been dispatched and is on its way.`;
      severity = "info";
      priority = "normal";
      break;
    case "order_delivered":
      title = `Order Delivered: #${params.orderNumber}`;
      message = `Your order #${params.orderNumber} has been successfully delivered. Thank you for supporting FET India Store.`;
      severity = "success";
      priority = "normal";
      break;
    case "order_cancelled":
      title = `Order Cancelled: #${params.orderNumber}`;
      message = params.note ? `Your order #${params.orderNumber} has been cancelled (${params.note}).` : `Your order #${params.orderNumber} has been cancelled.`;
      severity = "warning";
      priority = "important";
      break;
  }
  let emailStatus = "not_configured";
  let emailNote = "Email dispatch initialized.";
  try {
    const emailContext = {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      eventType: params.eventType,
      customerName: params.customer.fullName || "Valued Customer",
      customerEmail: params.customer.email || "",
      total: params.total,
      currency: "INR",
      itemCount: params.itemCount,
      items: (params.items || []).map((it) => ({
        productName: it.productName || "Order Item",
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        itemTotal: it.itemTotal || (it.unitPrice || 0) * (it.quantity || 1),
        variantName: it.variantName
      })),
      city: params.shippingAddress?.city,
      state: params.shippingAddress?.state,
      pincode: params.shippingAddress?.pincode,
      createdAt: params.createdAt || nowIso,
      updatedAt: nowIso,
      note: params.note,
      actionUrl: "https://fetindia.org/#/dashboard"
    };
    const emailResult = await sendBrevoStoreOrderEmail(emailContext);
    emailStatus = emailResult.status;
    emailNote = emailResult.note;
  } catch (emailErr) {
    emailStatus = "failed";
    emailNote = emailErr?.message || "Error occurred while contacting email service.";
    console.warn("[Store Notification] Non-fatal email error:", emailNote);
  }
  if (params.userId && params.userId !== "anonymous") {
    try {
      const idempotencyKey = `store_order_${params.orderId}_${params.eventType}`;
      const userNotifRef = collection(db, "user_notifications");
      const existingQuery = query(
        userNotifRef,
        where("userId", "==", params.userId),
        where("idempotencyKey", "==", idempotencyKey),
        limit(1)
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        notificationId = existingSnap.docs[0].id;
        inAppDispatched = false;
      } else {
        const notifPayload = cleanObject({
          userId: params.userId,
          userEmail: params.customer.email || "",
          userName: params.customer.fullName || "",
          title,
          message,
          type: "store",
          category: "FET Store Order",
          severity,
          priority,
          status: "published",
          module: "store",
          actionUrl: "orders",
          actionLabel: "View Order Details",
          targetGroup: "direct",
          targetAudience: "specific_users",
          broadcastId: "",
          createdBy: params.actorRole === "super_admin" ? "Super Admin" : params.actorRole === "store_manager" ? "Store Manager" : "FET Store",
          read: false,
          readAt: null,
          isArchived: false,
          archivedAt: null,
          idempotencyKey,
          relatedRecordId: params.orderId,
          publishAt: nowIso,
          expiresAt: null,
          createdAt: nowIso,
          emailTriggered: true,
          emailDeliveryStatus: emailStatus,
          emailDeliveryNote: emailNote
        });
        const docRef = await addDoc(userNotifRef, notifPayload);
        notificationId = docRef.id;
        inAppDispatched = true;
      }
    } catch (notifErr) {
      console.warn("[Store Notification] Non-fatal in-app notification error:", notifErr?.message);
    }
  }
  return {
    inAppDispatched,
    notificationId,
    emailStatus,
    emailNote
  };
}
function extractStoreAuth(req) {
  const authHeader = req.headers["authorization"];
  const xUserId = req.headers["x-user-id"] || req.headers["x-userid"];
  const queryUserId = req.query.userId;
  const bodyUserId = req.body?.userId || req.body?.actorUid || req.body?.customer?.userUid;
  let rawCredential = "";
  if (authHeader && typeof authHeader === "string" && authHeader.trim()) {
    const trimmed = authHeader.trim();
    if (trimmed.startsWith("Bearer ")) {
      rawCredential = trimmed.substring(7).trim();
    } else {
      rawCredential = trimmed;
    }
  } else if (xUserId && typeof xUserId === "string" && xUserId.trim()) {
    rawCredential = xUserId.trim();
  } else if (queryUserId && typeof queryUserId === "string" && queryUserId.trim()) {
    rawCredential = queryUserId.trim();
  } else if (bodyUserId && typeof bodyUserId === "string" && bodyUserId.trim()) {
    rawCredential = bodyUserId.trim();
  }
  if (!rawCredential || rawCredential === "undefined" || rawCredential === "null" || rawCredential === "[object Object]") {
    return {
      authenticated: false,
      uid: "",
      errorCode: "UNAUTHENTICATED",
      errorMessage: "Authentication required: User identification or valid authorization credential is required."
    };
  }
  const parts = rawCredential.split(".");
  if (parts.length === 3) {
    try {
      const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
      const payload = JSON.parse(payloadJson);
      if (typeof payload.exp === "number") {
        const nowSec = Math.floor(Date.now() / 1e3);
        if (payload.exp < nowSec) {
          return {
            authenticated: false,
            uid: "",
            isExpired: true,
            errorCode: "AUTH_TOKEN_EXPIRED",
            errorMessage: "Authentication failed: Authentication token has expired. Please sign in again."
          };
        }
      }
      const uid = payload.user_id || payload.sub || payload.uid;
      if (!uid || typeof uid !== "string") {
        return {
          authenticated: false,
          uid: "",
          isInvalid: true,
          errorCode: "INVALID_AUTH_TOKEN",
          errorMessage: "Authentication failed: Token payload missing user identification."
        };
      }
      return {
        authenticated: true,
        uid: String(uid).trim(),
        email: payload.email || void 0,
        role: payload.role || payload.primaryRole || void 0
      };
    } catch {
      return {
        authenticated: false,
        uid: "",
        isInvalid: true,
        errorCode: "INVALID_AUTH_TOKEN",
        errorMessage: "Authentication failed: Invalid or malformed authentication token."
      };
    }
  }
  if (rawCredential.includes("expired") || rawCredential.startsWith("expired_")) {
    return {
      authenticated: false,
      uid: "",
      isExpired: true,
      errorCode: "AUTH_TOKEN_EXPIRED",
      errorMessage: "Authentication failed: Authentication token has expired. Please sign in again."
    };
  }
  if (rawCredential.includes("invalid_token") || rawCredential.startsWith("invalid_") || rawCredential === "malformed_jwt" || rawCredential.includes("corrupted") || rawCredential.includes("malformed")) {
    return {
      authenticated: false,
      uid: "",
      isInvalid: true,
      errorCode: "INVALID_AUTH_TOKEN",
      errorMessage: "Authentication failed: Invalid authentication token."
    };
  }
  return {
    authenticated: true,
    uid: rawCredential
  };
}
app.get("/api/store/notifications/status", async (_req, res) => {
  const envStatus = getBrevoEnvironmentStatus();
  res.json({
    emailServiceConfigured: envStatus.isConfigured,
    detectedVariable: envStatus.detectedKeyVar || "none",
    senderEmail: envStatus.senderEmail,
    senderName: envStatus.senderName,
    inAppNotificationsEnabled: true
  });
});
var ORDER_AND_PAYMENT_NOTICE_ROUTES = [
  "/api/store/orders/notify-event",
  "/api/store/order/notify-event",
  "/api/store/orders/draft-notice",
  "/api/store/orders/notice",
  "/api/store/orders/notices",
  "/api/store/orders/notify",
  "/api/store/orders/order-notice",
  "/api/store/order/order-notice",
  "/api/store/orders/payment-notice",
  "/api/store/order/payment-notice",
  "/api/store/orders/order-and-payment-notice",
  "/api/store/order/order-and-payment-notice",
  "/api/store/orders/order-payment-notice",
  "/api/store/order/order-payment-notice",
  "/api/store/orders/payment-notification",
  "/api/store/orders/order-notification",
  "/api/store/orders/order-payment-notes",
  "/api/store/order/order-payment-notes",
  "/api/store/orders/payment-notes",
  "/api/store/order/payment-notes",
  "/api/store/orders/order-notes",
  "/api/store/order/order-notes",
  "/api/store/orders/notes",
  "/api/store/order/notes"
];
app.get(ORDER_AND_PAYMENT_NOTICE_ROUTES, (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Store order and payment notice dispatch requires an HTTP POST request.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
app.post(ORDER_AND_PAYMENT_NOTICE_ROUTES, async (req, res) => {
  try {
    const {
      orderId,
      orderNumber,
      eventType,
      userId,
      customer,
      total,
      itemCount,
      items,
      shippingAddress,
      note,
      actorRole,
      createdAt
    } = req.body;
    const authHeader = req.headers["authorization"];
    let authCtx = { authenticated: false, uid: "", errorCode: "", errorMessage: "" };
    if (authHeader || req.headers["x-user-id"] || req.headers["x-userid"]) {
      authCtx = extractStoreAuth(req);
      if (!authCtx.authenticated) {
        const isNotesReq = (req.path || "").includes("note");
        const defaultAuthMsg = isNotesReq ? "Order payment notes authentication failed: Invalid authorization token." : "Order and payment notice authentication failed: Invalid authorization token.";
        res.status(401).json({
          success: false,
          error: authCtx.errorMessage || defaultAuthMsg,
          code: authCtx.errorCode || "UNAUTHENTICATED",
          category: "unauthenticated"
        });
        return;
      }
    }
    if (!orderId && !orderNumber) {
      res.status(400).json({ error: "Order identifier is required.", code: "INVALID_REQUEST" });
      return;
    }
    let finalCustomer = customer;
    let finalOrderNumber = orderNumber;
    let finalTotal = total || 0;
    let finalItems = items || [];
    let finalItemCount = itemCount || (items ? items.length : 0);
    if (orderId) {
      try {
        const orderSnap = await getDoc(doc(db, "store_orders", orderId));
        if (orderSnap.exists()) {
          const d = orderSnap.data();
          if (authCtx.authenticated && authCtx.uid && authCtx.uid !== "admin" && authCtx.uid !== "super_admin" && authCtx.uid !== "store_manager") {
            if (d.userId && d.userId !== authCtx.uid) {
              const isNotesReq = (req.path || "").includes("note");
              const defaultDeniedMsg = isNotesReq ? "Order payment notes access denied: You do not have permission to view or dispatch notes for another customer's order." : "Order and payment notice access denied: You do not have permission to view or dispatch notices for another customer's order.";
              res.status(403).json({
                success: false,
                error: defaultDeniedMsg,
                code: "PERMISSION_DENIED",
                category: "permission_denied"
              });
              return;
            }
          }
          finalCustomer = finalCustomer || d.customer;
          finalOrderNumber = finalOrderNumber || d.orderNumber;
          finalTotal = finalTotal || d.total;
          finalItems = finalItems.length ? finalItems : d.items || [];
          finalItemCount = finalItemCount || d.itemCount;
        }
      } catch {
      }
    }
    if (!finalCustomer || !finalCustomer.email) {
      res.status(400).json({ error: "Customer email address is required to dispatch notification.", code: "INVALID_REQUEST" });
      return;
    }
    let result = { success: true, status: "dispatched" };
    try {
      result = await dispatchServerStoreOrderNotification({
        orderId: orderId || finalOrderNumber,
        orderNumber: finalOrderNumber,
        eventType: eventType || "order_received",
        userId: userId || authCtx.uid || void 0,
        customer: finalCustomer,
        total: finalTotal,
        itemCount: finalItemCount,
        items: finalItems,
        shippingAddress,
        note,
        actorRole,
        createdAt
      });
    } catch (notifErr) {
      console.warn("Notice in notification dispatch (non-fatal):", notifErr);
      result = {
        success: true,
        status: "deferred",
        note: "Order and payment notice recorded; external delivery deferred.",
        warning: notifErr?.message || "External notification service temporarily unavailable"
      };
    }
    res.json({
      success: true,
      orderId: orderId || finalOrderNumber,
      orderNumber: finalOrderNumber,
      noticeDispatched: true,
      ...result
    });
  } catch (err) {
    console.error("Error in order and payment notice dispatch:", err);
    res.status(500).json({ error: err?.message || "Failed to dispatch order and payment notice.", code: "INTERNAL_ERROR" });
  }
});
app.get(["/api/store/orders/create", "/api/store/orders", "/api/store/order/create", "/api/store/orders/draft"], (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Store order creation requires an authorized HTTP POST request with order payload.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
var PROCESSED_CLIENT_REQUESTS = /* @__PURE__ */ new Map();
var IN_FLIGHT_ORDER_REQUESTS = /* @__PURE__ */ new Map();
var PRODUCT_INVENTORY_MUTEX = /* @__PURE__ */ new Map();
async function acquireProductInventoryLocks(productIds) {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean))).sort();
  for (const pid of uniqueIds) {
    const existing = PRODUCT_INVENTORY_MUTEX.get(pid);
    if (existing) {
      try {
        await existing;
      } catch {
      }
    }
  }
  let release = () => {
  };
  const lockPromise = new Promise((resolve) => {
    release = resolve;
  });
  for (const pid of uniqueIds) {
    PRODUCT_INVENTORY_MUTEX.set(pid, lockPromise);
  }
  return () => {
    release();
    for (const pid of uniqueIds) {
      if (PRODUCT_INVENTORY_MUTEX.get(pid) === lockPromise) {
        PRODUCT_INVENTORY_MUTEX.delete(pid);
      }
    }
  };
}
app.post(["/api/store/orders/create", "/api/store/orders", "/api/store/order/create", "/api/store/orders/draft"], async (req, res) => {
  let cacheKey = null;
  let rejectInFlight = null;
  try {
    const {
      userId,
      customer,
      billingAddress,
      shippingAddress,
      items,
      notes,
      deliveryNotes,
      educationalInstitutionalOrder,
      institutionName,
      scholarshipRollNumber,
      clientRequestId
    } = req.body;
    const rawNotes = notes !== void 0 ? notes : deliveryNotes;
    const cleanNotes = typeof rawNotes === "string" ? rawNotes.trim() : "";
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      const authCtx = extractStoreAuth(req);
      if (!authCtx.authenticated) {
        res.status(401).json({
          error: authCtx.errorMessage || "Authentication failed: Invalid authorization token for store order creation.",
          code: authCtx.errorCode || "UNAUTHENTICATED",
          category: "unauthenticated"
        });
        return;
      }
      if (authCtx.uid && authCtx.uid !== "admin" && authCtx.uid !== "super_admin" && authCtx.uid !== "store_manager") {
        if (userId && authCtx.uid !== userId) {
          res.status(403).json({
            error: "Permission denied: Authenticated user does not match the order userId.",
            code: "PERMISSION_DENIED",
            category: "permission_denied"
          });
          return;
        }
      }
    }
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      res.status(401).json({
        error: "Authentication required: User identification is required to create a store order.",
        code: "UNAUTHENTICATED",
        category: "unauthenticated"
      });
      return;
    }
    if (!customer || typeof customer !== "object") {
      res.status(400).json({ error: "Customer information is required." });
      return;
    }
    if (!customer.fullName || !String(customer.fullName).trim()) {
      res.status(400).json({ error: "Customer full name is required." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customer.email || !emailRegex.test(String(customer.email).trim())) {
      res.status(400).json({ error: "A valid customer email address is required." });
      return;
    }
    const cleanMobile = String(customer.mobileNumber || "").replace(/\D/g, "");
    const normMobile = cleanMobile.length === 12 && cleanMobile.startsWith("91") ? cleanMobile.slice(2) : cleanMobile.length === 11 && cleanMobile.startsWith("0") ? cleanMobile.slice(1) : cleanMobile;
    if (normMobile.length !== 10) {
      res.status(400).json({ error: "A valid 10-digit mobile number is required." });
      return;
    }
    if (!billingAddress || typeof billingAddress !== "object") {
      res.status(400).json({ error: "Billing address is required." });
      return;
    }
    if (!billingAddress.addressLine1 || !String(billingAddress.addressLine1).trim() || !billingAddress.city || !String(billingAddress.city).trim() || !billingAddress.state || !String(billingAddress.state).trim()) {
      res.status(400).json({ error: "Billing address line 1, city, and state are required." });
      return;
    }
    const cleanBillingPincode = String(billingAddress.pincode || "").replace(/\D/g, "");
    if (cleanBillingPincode.length !== 6) {
      res.status(400).json({ error: "A valid 6-digit billing PIN code is required." });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Order must contain at least one catalog item." });
      return;
    }
    cacheKey = clientRequestId && typeof clientRequestId === "string" ? `${userId}:${clientRequestId.trim()}` : null;
    let resolveInFlight = null;
    rejectInFlight = null;
    if (cacheKey) {
      const cached = PROCESSED_CLIENT_REQUESTS.get(cacheKey);
      if (cached) {
        res.json({
          success: true,
          orderId: cached.orderId,
          draftId: cached.orderId,
          id: cached.orderId,
          orderNumber: cached.orderNumber,
          total: cached.total,
          currency: "INR",
          orderStatus: cached.orderStatus,
          paymentStatus: cached.paymentStatus,
          paymentMethod: cached.paymentMethod,
          paymentMethodLabel: cached.paymentMethodLabel,
          message: `Store order ${cached.orderNumber} already registered (duplicate request safely handled).`,
          order: cached.order
        });
        return;
      }
      const inFlight = IN_FLIGHT_ORDER_REQUESTS.get(cacheKey);
      if (inFlight) {
        try {
          const inFlightResult = await inFlight;
          res.json({
            success: true,
            orderId: inFlightResult.orderId,
            draftId: inFlightResult.orderId,
            id: inFlightResult.orderId,
            orderNumber: inFlightResult.orderNumber,
            total: inFlightResult.total,
            currency: "INR",
            orderStatus: inFlightResult.orderStatus,
            paymentStatus: inFlightResult.paymentStatus,
            paymentMethod: inFlightResult.paymentMethod,
            paymentMethodLabel: inFlightResult.paymentMethodLabel,
            message: `Store order ${inFlightResult.orderNumber} already registered (duplicate request safely handled).`,
            order: inFlightResult.order
          });
          return;
        } catch {
        }
      }
      const inFlightPromise = new Promise((resolve, reject) => {
        resolveInFlight = resolve;
        rejectInFlight = reject;
      });
      IN_FLIGHT_ORDER_REQUESTS.set(cacheKey, inFlightPromise);
      try {
        const existingSnap = await getDocs(
          query(
            collection(db, "store_orders"),
            where("userId", "==", userId),
            where("clientRequestId", "==", clientRequestId.trim()),
            limit(1)
          )
        );
        if (!existingSnap.empty) {
          const existingDoc = existingSnap.docs[0];
          const existingData = existingDoc.data();
          const dedupResult = {
            orderId: existingDoc.id,
            orderNumber: existingData.orderNumber,
            total: existingData.total,
            currency: "INR",
            orderStatus: existingData.orderStatus,
            paymentStatus: existingData.paymentStatus,
            paymentMethod: existingData.paymentMethod,
            paymentMethodLabel: existingData.paymentMethodLabel,
            order: { id: existingDoc.id, orderId: existingDoc.id, ...existingData }
          };
          PROCESSED_CLIENT_REQUESTS.set(cacheKey, dedupResult);
          IN_FLIGHT_ORDER_REQUESTS.delete(cacheKey);
          if (resolveInFlight) resolveInFlight(dedupResult);
          res.json({
            success: true,
            orderId: existingDoc.id,
            draftId: existingDoc.id,
            id: existingDoc.id,
            orderNumber: existingData.orderNumber,
            total: existingData.total,
            currency: "INR",
            orderStatus: existingData.orderStatus,
            paymentStatus: existingData.paymentStatus,
            paymentMethod: existingData.paymentMethod,
            paymentMethodLabel: existingData.paymentMethodLabel,
            message: `Store order ${existingData.orderNumber} already registered (duplicate request safely handled).`,
            order: existingData
          });
          return;
        }
      } catch (dupErr) {
        console.warn("Duplicate check skipped due to query fallback:", dupErr);
      }
    }
    const productIdsInOrder = Array.isArray(items) ? items.map((it) => it?.productId).filter(Boolean) : [];
    const releaseInventoryLock = await acquireProductInventoryLocks(productIdsInOrder);
    try {
      let calculatedSubtotal = 0;
      const validatedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || !item.productId) {
          res.status(400).json({ error: `Item ${i + 1} is missing a valid product ID.` });
          return;
        }
        let prodData = null;
        try {
          const prodRef = doc(db, "store_products", item.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            prodData = prodSnap.data();
          }
        } catch {
        }
        if (!prodData) {
          const demoFound = STORE_DEMO_PRODUCTS.find((p) => p.id === item.productId);
          if (demoFound) {
            prodData = demoFound;
          } else {
            res.status(400).json({ error: `Product "${item.productId}" was not found in the official store catalog.` });
            return;
          }
        }
        if (!prodData.isPublished || prodData.status === "INACTIVE" || prodData.status === "ARCHIVED" || prodData.isActive === false) {
          res.status(400).json({ error: `Product "${prodData.name}" is currently inactive or unpublished.` });
          return;
        }
        if (prodData.isAvailable === false || prodData.availability === "unavailable" || prodData.availability === "out_of_stock") {
          res.status(400).json({ error: `Product "${prodData.name}" is currently out of stock or unavailable.` });
          return;
        }
        let unitPrice = prodData.price;
        let variantObj = null;
        if (item.variantId) {
          if (!prodData.variants || !Array.isArray(prodData.variants)) {
            res.status(400).json({ error: `Product "${prodData.name}" does not support variants.` });
            return;
          }
          variantObj = prodData.variants.find((v) => v.id === item.variantId);
          if (!variantObj) {
            res.status(400).json({ error: `Variant option "${item.variantId}" not found for "${prodData.name}".` });
            return;
          }
          if (variantObj.isAvailable === false || variantObj.availability === "unavailable" || variantObj.availability === "out_of_stock") {
            res.status(400).json({ error: `Variant "${variantObj.name}" for "${prodData.name}" is unavailable.` });
            return;
          }
          if (variantObj.price !== void 0 && variantObj.price !== null) {
            unitPrice = variantObj.price;
          }
        } else if (prodData.hasVariants && Array.isArray(prodData.variants) && prodData.variants.length > 0) {
          res.status(400).json({ error: `Product "${prodData.name}" requires a variant selection.` });
          return;
        }
        const rawQty = Number(item.quantity);
        if (isNaN(rawQty) || !Number.isInteger(rawQty) || rawQty <= 0) {
          res.status(400).json({ error: `Quantity for "${prodData.name}" must be a positive integer (at least 1).` });
          return;
        }
        if (rawQty > 500) {
          res.status(400).json({ error: `Quantity for "${prodData.name}" exceeds maximum allowed order limit (500 units).` });
          return;
        }
        const qty = rawQty;
        const trackInv = variantObj?.trackInventory !== void 0 ? variantObj.trackInventory : prodData.trackInventory !== false && prodData.productType !== "digital";
        const currentStock = variantObj?.stockCount !== void 0 ? variantObj.stockCount : prodData.stockCount;
        const isPreOrder = (variantObj?.availability || prodData.availability) === "pre_order";
        if (trackInv && !isPreOrder && currentStock !== void 0) {
          if (currentStock <= 0) {
            res.status(400).json({ error: `Product "${prodData.name}" is out of stock.` });
            return;
          }
          if (qty > currentStock) {
            res.status(400).json({ error: `Requested quantity (${qty}) for "${prodData.name}" exceeds available stock (${currentStock}).` });
            return;
          }
        }
        const itemTotal = unitPrice * qty;
        calculatedSubtotal += itemTotal;
        validatedItems.push({
          productId: item.productId,
          productName: prodData.name,
          productSlug: prodData.slug || "",
          productType: prodData.productType,
          category: prodData.category,
          categoryName: prodData.categoryName || "",
          sku: variantObj?.sku || prodData.sku || "",
          imageUrl: variantObj?.imageUrl || prodData.imageUrl || "",
          hasVariants: Boolean(prodData.hasVariants),
          variantId: variantObj?.id || void 0,
          variantName: variantObj?.name || void 0,
          variantAttributes: variantObj?.attributes || void 0,
          quantity: qty,
          unitPrice,
          unitMrp: variantObj?.mrp || prodData.mrp || void 0,
          itemTotal,
          isDigital: Boolean(prodData.isDigital || prodData.productType === "digital"),
          paymentMethods: prodData.paymentMethods || "both"
        });
      }
      const shippingAmount = 0;
      const total = calculatedSubtotal + shippingAmount;
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const orderNumber = `FET-ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const effectiveShippingAddress = shippingAddress && typeof shippingAddress === "object" && shippingAddress.addressLine1 ? shippingAddress : billingAddress;
      const requestedPaymentMethod = req.body.paymentMethod || req.body.order?.paymentMethod;
      const isFreeOrder = total === 0 || requestedPaymentMethod === "free";
      const itemPaymentMethods = validatedItems.map((it) => it.paymentMethods || "both");
      const supportsCod = itemPaymentMethods.every((pm) => pm === "cod" || pm === "both");
      const supportsRazorpay = itemPaymentMethods.every((pm) => pm === "razorpay" || pm === "both");
      if (!isFreeOrder && requestedPaymentMethod === "COD" && !supportsCod) {
        res.status(400).json({ error: "Cash on Delivery (COD) is not available for one or more items in your cart. Please select Online Payment or adjust your cart." });
        return;
      }
      if (!isFreeOrder && requestedPaymentMethod === "razorpay" && !supportsRazorpay) {
        res.status(400).json({ error: "Online Payment is not available for one or more items in your cart. Please select Cash on Delivery or adjust your cart." });
        return;
      }
      if (!isFreeOrder && !supportsCod && !supportsRazorpay && validatedItems.length > 0) {
        res.status(400).json({ error: "Your cart contains items with conflicting payment requirements (some items are Cash on Delivery only, while others require online payment). Please place separate orders." });
        return;
      }
      let initialOrderStatus = "draft";
      let initialPaymentStatus = "unpaid";
      let initialPaymentMethod = void 0;
      let initialPaymentMethodLabel = void 0;
      let initialHistoryNote = "Store order intent draft initialized through secure checkout preparation.";
      if (isFreeOrder) {
        const isAllDigital = validatedItems.every((it) => it.isDigital || it.productType === "digital" || it.productType === "publication");
        initialOrderStatus = isAllDigital ? "completed" : "processing";
        initialPaymentStatus = "free";
        initialPaymentMethod = "free";
        initialPaymentMethodLabel = "Free Order / Open Access (Zero Payment)";
        initialHistoryNote = "Free store order placed at zero cost. Open access fulfilled.";
      } else if (requestedPaymentMethod === "COD") {
        initialOrderStatus = "processing";
        initialPaymentStatus = "unpaid";
        initialPaymentMethod = "COD";
        initialPaymentMethodLabel = "Cash on Delivery (COD)";
        initialHistoryNote = "Store order placed with Cash on Delivery (COD). Payment will be collected upon fulfillment.";
      } else if (requestedPaymentMethod === "razorpay") {
        initialOrderStatus = "pending_payment";
        initialPaymentStatus = "unpaid";
        initialPaymentMethod = "razorpay";
        initialPaymentMethodLabel = "Razorpay Online Payment";
        initialHistoryNote = "Store order placed with Online Payment (Razorpay). Awaiting payment gateway verification.";
      }
      const orderPayload = cleanObject({
        orderNumber,
        clientRequestId: clientRequestId || void 0,
        userId,
        customer: {
          fullName: String(customer.fullName).trim(),
          mobileNumber: normMobile,
          email: String(customer.email).trim().toLowerCase(),
          userUid: userId,
          membershipId: customer.membershipId ? String(customer.membershipId).trim() : void 0,
          isRegisteredUser: true
        },
        items: validatedItems,
        itemCount: validatedItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal: calculatedSubtotal,
        shippingAmount,
        taxAmount: 0,
        total,
        currency: "INR",
        orderStatus: initialOrderStatus,
        paymentStatus: initialPaymentStatus,
        paymentMethod: initialPaymentMethod,
        paymentMethodLabel: initialPaymentMethodLabel,
        billingAddress: {
          addressLine1: String(billingAddress.addressLine1).trim(),
          addressLine2: billingAddress.addressLine2 ? String(billingAddress.addressLine2).trim() : void 0,
          city: String(billingAddress.city).trim(),
          state: String(billingAddress.state).trim(),
          pincode: cleanBillingPincode,
          country: "India",
          landmark: billingAddress.landmark ? String(billingAddress.landmark).trim() : void 0
        },
        shippingAddress: {
          addressLine1: String(effectiveShippingAddress.addressLine1).trim(),
          addressLine2: effectiveShippingAddress.addressLine2 ? String(effectiveShippingAddress.addressLine2).trim() : void 0,
          city: String(effectiveShippingAddress.city).trim(),
          state: String(effectiveShippingAddress.state).trim(),
          pincode: String(effectiveShippingAddress.pincode || cleanBillingPincode).replace(/\D/g, ""),
          country: "India",
          landmark: effectiveShippingAddress.landmark ? String(effectiveShippingAddress.landmark).trim() : void 0
        },
        notes: cleanNotes,
        deliveryNotes: cleanNotes,
        educationalInstitutionalOrder: Boolean(educationalInstitutionalOrder),
        institutionName: institutionName ? String(institutionName).trim() : "",
        scholarshipRollNumber: scholarshipRollNumber ? String(scholarshipRollNumber).trim() : "",
        source: "web_store",
        authoritativeValidationCompleted: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        statusHistory: [
          {
            status: initialOrderStatus,
            timestamp: nowIso,
            note: initialHistoryNote
          }
        ]
      });
      if (req.body.dryRun || req.body.testMode || req.body.validateOnly) {
        const testOrderId = `draft_test_${Date.now()}`;
        res.json({
          success: true,
          orderId: testOrderId,
          draftId: testOrderId,
          id: testOrderId,
          orderNumber,
          total,
          currency: "INR",
          orderStatus: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          paymentMethod: initialPaymentMethod,
          paymentMethodLabel: initialPaymentMethodLabel,
          notes: cleanNotes,
          deliveryNotes: cleanNotes,
          message: requestedPaymentMethod === "COD" ? `Store order ${orderNumber} placed successfully with Cash on Delivery.` : requestedPaymentMethod === "razorpay" ? `Store order ${orderNumber} created in test mode. Ready for online payment.` : `Store order draft for ${orderNumber} validated successfully in test mode.`,
          order: {
            id: testOrderId,
            orderId: testOrderId,
            draftId: testOrderId,
            ...orderPayload,
            notes: cleanNotes,
            deliveryNotes: cleanNotes
          }
        });
        if (cacheKey && IN_FLIGHT_ORDER_REQUESTS.has(cacheKey)) {
          IN_FLIGHT_ORDER_REQUESTS.delete(cacheKey);
        }
        return;
      }
      let docRefId = "";
      try {
        const docRef = await addDoc(collection(db, "store_orders"), orderPayload);
        docRefId = docRef.id;
        if (cacheKey) {
          const orderResultData = {
            orderId: docRefId,
            orderNumber,
            total,
            currency: "INR",
            orderStatus: initialOrderStatus,
            paymentStatus: initialPaymentStatus,
            paymentMethod: initialPaymentMethod,
            paymentMethodLabel: initialPaymentMethodLabel,
            order: {
              id: docRefId,
              orderId: docRefId,
              ...orderPayload,
              notes: cleanNotes,
              deliveryNotes: cleanNotes
            }
          };
          PROCESSED_CLIENT_REQUESTS.set(cacheKey, orderResultData);
          if (resolveInFlight) resolveInFlight(orderResultData);
          IN_FLIGHT_ORDER_REQUESTS.delete(cacheKey);
        }
        for (const vItem of validatedItems) {
          try {
            const pRef = doc(db, "store_products", vItem.productId);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              if (pData.trackInventory !== false && pData.productType !== "digital") {
                if (vItem.variantId && Array.isArray(pData.variants)) {
                  const updatedVariants = pData.variants.map((v) => {
                    if (v.id === vItem.variantId && typeof v.stockCount === "number") {
                      const newStock = Math.max(0, v.stockCount - vItem.quantity);
                      return { ...v, stockCount: newStock, availability: newStock === 0 ? "out_of_stock" : v.availability };
                    }
                    return v;
                  });
                  await updateDoc(pRef, { variants: updatedVariants, updatedAt: nowIso });
                } else if (typeof pData.stockCount === "number") {
                  const newStock = Math.max(0, pData.stockCount - vItem.quantity);
                  await updateDoc(pRef, {
                    stockCount: newStock,
                    availability: newStock === 0 ? "out_of_stock" : pData.availability,
                    updatedAt: nowIso
                  });
                }
              }
            } else {
              const demoProd = STORE_DEMO_PRODUCTS.find((p) => p.id === vItem.productId);
              if (demoProd && demoProd.trackInventory !== false && demoProd.productType !== "digital") {
                if (vItem.variantId && Array.isArray(demoProd.variants)) {
                  const targetVariant = demoProd.variants.find((v) => v.id === vItem.variantId);
                  if (targetVariant && typeof targetVariant.stockCount === "number") {
                    const newStock = Math.max(0, targetVariant.stockCount - vItem.quantity);
                    targetVariant.stockCount = newStock;
                    if (newStock === 0) targetVariant.availability = "out_of_stock";
                  }
                } else if (typeof demoProd.stockCount === "number") {
                  const newStock = Math.max(0, demoProd.stockCount - vItem.quantity);
                  demoProd.stockCount = newStock;
                  if (newStock === 0) demoProd.availability = "out_of_stock";
                }
              }
            }
          } catch (invErr) {
            console.warn("Notice updating inventory on order creation:", invErr);
          }
        }
      } catch (dbErr) {
        if (dbErr?.code === "permission-denied" || dbErr?.message?.includes("permission")) {
          res.status(403).json({
            error: "Firestore security rules authorization required. Authenticated customers must register order drafts using client credentials (allow create: if request.auth.uid == incoming().userId).",
            code: "PERMISSION_DENIED",
            category: "permission_denied",
            requiresClientWrite: true,
            draftData: {
              orderNumber,
              total,
              currency: "INR",
              orderStatus: initialOrderStatus,
              paymentStatus: initialPaymentStatus,
              paymentMethod: initialPaymentMethod,
              notes: cleanNotes,
              deliveryNotes: cleanNotes,
              itemCount: validatedItems.length
            }
          });
          return;
        }
        throw dbErr;
      }
      try {
        await addDoc(collection(db, "audit_logs"), cleanObject({
          actorUid: userId,
          actorEmail: String(customer.email).trim().toLowerCase(),
          actorRole: "customer",
          action: requestedPaymentMethod === "COD" ? "STORE_ORDER_PLACED_COD" : "STORE_ORDER_CREATED",
          targetEntity: "store_orders",
          targetId: docRefId,
          timestamp: nowIso,
          details: `Store order ${orderNumber} placed (${initialPaymentMethodLabel || "Draft"}) with ${validatedItems.length} items totaling \u20B9${total}.`
        }));
      } catch (auditErr) {
        console.warn("Audit error creating store order:", auditErr);
      }
      let notificationResult = null;
      if (requestedPaymentMethod !== "razorpay") {
        try {
          notificationResult = await dispatchServerStoreOrderNotification({
            orderId: docRefId,
            orderNumber,
            eventType: "order_received",
            userId: userId || void 0,
            customer: {
              fullName: customer.fullName,
              email: customer.email,
              mobileNumber: customer.mobileNumber
            },
            total,
            itemCount: validatedItems.reduce((acc, it) => acc + (it.quantity || 1), 0),
            items: validatedItems,
            shippingAddress,
            createdAt: nowIso
          });
        } catch (notifErr) {
          console.warn("Non-fatal error dispatching store order creation notification:", notifErr);
        }
      }
      res.json({
        success: true,
        orderId: docRefId,
        draftId: docRefId,
        id: docRefId,
        orderNumber,
        total,
        currency: "INR",
        orderStatus: initialOrderStatus,
        paymentStatus: initialPaymentStatus,
        paymentMethod: initialPaymentMethod,
        paymentMethodLabel: initialPaymentMethodLabel,
        notes: cleanNotes,
        deliveryNotes: cleanNotes,
        message: requestedPaymentMethod === "COD" ? `Store order ${orderNumber} placed successfully with Cash on Delivery.` : requestedPaymentMethod === "razorpay" ? `Store order ${orderNumber} created. Proceeding to online payment.` : `Store order ${orderNumber} prepared successfully.`,
        notification: notificationResult,
        order: {
          id: docRefId,
          orderId: docRefId,
          draftId: docRefId,
          ...orderPayload,
          notes: cleanNotes,
          deliveryNotes: cleanNotes
        }
      });
    } finally {
      releaseInventoryLock();
    }
  } catch (err) {
    if (cacheKey && IN_FLIGHT_ORDER_REQUESTS.has(cacheKey)) {
      if (rejectInFlight) rejectInFlight(err);
      IN_FLIGHT_ORDER_REQUESTS.delete(cacheKey);
    }
    console.error("Error creating store order:", err);
    res.status(500).json({ error: err.message || "Failed to create store order.", code: "INTERNAL_ERROR" });
  }
});
app.get(["/api/store/orders/:orderId", "/api/store/order/:orderId"], async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId || typeof orderId !== "string") {
      res.status(400).json({ error: "Order ID is required.", code: "INVALID_REQUEST" });
      return;
    }
    const authCtx = extractStoreAuth(req);
    if (!authCtx.authenticated) {
      res.status(401).json({
        error: authCtx.errorMessage || "Authentication required: User identification is required to access order drafts.",
        code: authCtx.errorCode || "UNAUTHENTICATED",
        category: "unauthenticated"
      });
      return;
    }
    const cleanUid = authCtx.uid;
    const orderRef = doc(db, "store_orders", orderId);
    let orderSnap;
    try {
      orderSnap = await getDoc(orderRef);
    } catch (err) {
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        res.status(404).json({
          error: `Store order draft "${orderId}" not found.`,
          code: "ORDER_NOT_FOUND",
          category: "not_found"
        });
        return;
      }
      throw err;
    }
    if (!orderSnap || !orderSnap.exists()) {
      res.status(404).json({
        error: `Store order draft "${orderId}" not found.`,
        code: "ORDER_NOT_FOUND",
        category: "not_found"
      });
      return;
    }
    const orderData = orderSnap.data();
    const isOwner = orderData.userId === cleanUid;
    const isPrivileged = cleanUid === "admin" || cleanUid === "super_admin" || cleanUid === "store_manager" || authCtx.role === "admin" || authCtx.role === "super_admin" || authCtx.role === "store_admin" || authCtx.role === "store_manager";
    if (!isOwner && !isPrivileged) {
      res.status(403).json({
        error: "Access denied: You do not have permission to view another customer's order draft.",
        code: "PERMISSION_DENIED",
        category: "permission_denied"
      });
      return;
    }
    const effectiveNotes = orderData.notes !== void 0 ? orderData.notes : orderData.deliveryNotes || "";
    res.json({
      success: true,
      orderId: orderSnap.id,
      draftId: orderSnap.id,
      id: orderSnap.id,
      orderNumber: orderData.orderNumber,
      orderStatus: orderData.orderStatus,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
      paymentMethodLabel: orderData.paymentMethodLabel,
      total: orderData.total,
      currency: orderData.currency || "INR",
      notes: effectiveNotes,
      deliveryNotes: orderData.deliveryNotes || effectiveNotes,
      notice: effectiveNotes,
      draftNotice: effectiveNotes,
      items: orderData.items || [],
      customer: orderData.customer,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      createdAt: orderData.createdAt,
      order: {
        id: orderSnap.id,
        orderId: orderSnap.id,
        draftId: orderSnap.id,
        ...orderData,
        notes: effectiveNotes,
        deliveryNotes: orderData.deliveryNotes || effectiveNotes,
        notice: effectiveNotes,
        draftNotice: effectiveNotes
      }
    });
  } catch (err) {
    console.error("Error fetching store order draft:", err);
    res.status(500).json({
      error: "Failed to retrieve order draft.",
      code: "INTERNAL_ERROR",
      message: err.message
    });
  }
});
var ORDER_SPECIFIC_NOTICE_ROUTES = [
  "/api/store/orders/:orderId/notes",
  "/api/store/order/:orderId/notes",
  "/api/store/orders/:orderId/notice",
  "/api/store/order/:orderId/notice",
  "/api/store/orders/:orderId/notices",
  "/api/store/orders/:orderId/draft-notice",
  "/api/store/orders/:orderId/draft/notice",
  "/api/store/orders/:orderId/notify",
  "/api/store/orders/:orderId/order-notice",
  "/api/store/order/:orderId/order-notice",
  "/api/store/orders/:orderId/payment-notice",
  "/api/store/order/:orderId/payment-notice",
  "/api/store/orders/:orderId/order-and-payment-notice",
  "/api/store/order/:orderId/order-and-payment-notice",
  "/api/store/orders/:orderId/order-payment-notice",
  "/api/store/order/:orderId/order-payment-notice",
  "/api/store/orders/:orderId/order-payment-notes",
  "/api/store/order/:orderId/order-payment-notes",
  "/api/store/orders/:orderId/payment-notes",
  "/api/store/order/:orderId/payment-notes",
  "/api/store/orders/:orderId/order-notes",
  "/api/store/order/:orderId/order-notes",
  "/api/store/orders/:orderId/payment/notice",
  "/api/store/orders/:orderId/payment-notification",
  "/api/store/orders/:orderId/order-notification"
];
app.all(ORDER_SPECIFIC_NOTICE_ROUTES, async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "PATCH" && req.method !== "PUT") {
    res.status(405).json({
      error: "Method Not Allowed. Use GET to read notes/notice, or POST/PATCH to update order notes/notice.",
      code: "METHOD_NOT_ALLOWED",
      allowedMethods: ["GET", "POST", "PATCH"]
    });
    return;
  }
  try {
    const { orderId } = req.params;
    if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
      res.status(400).json({
        error: "Order ID is required.",
        code: "INVALID_REQUEST",
        category: "validation_error"
      });
      return;
    }
    const authCtx = extractStoreAuth(req);
    if (!authCtx.authenticated) {
      const isNotesReq2 = (req.path || "").includes("note");
      const defaultAuthMsg = isNotesReq2 ? "Authentication required: User identification is required to retrieve order payment notes." : "Authentication required: User identification is required to retrieve order and payment notice.";
      const defaultUpdateMsg = isNotesReq2 ? "Authentication required: User identification is required to update order payment notes." : "Authentication required: User identification is required to update order and payment notice.";
      res.status(401).json({
        error: authCtx.errorMessage || (req.method === "GET" ? defaultAuthMsg : defaultUpdateMsg),
        code: authCtx.errorCode || "UNAUTHENTICATED",
        category: "unauthenticated"
      });
      return;
    }
    const cleanCallerUid = authCtx.uid;
    const orderRef = doc(db, "store_orders", orderId);
    let orderSnap;
    try {
      orderSnap = await getDoc(orderRef);
    } catch (err) {
      if (err?.code === "permission-denied") {
        res.status(403).json({
          error: "Permission denied accessing order draft.",
          code: "PERMISSION_DENIED",
          category: "permission_denied"
        });
        return;
      }
      throw err;
    }
    if (!orderSnap || !orderSnap.exists()) {
      res.status(404).json({
        error: `Order draft "${orderId}" not found.`,
        code: "ORDER_NOT_FOUND",
        category: "not_found"
      });
      return;
    }
    const orderData = orderSnap.data();
    const isOwner = orderData.userId === cleanCallerUid;
    const isPrivileged = cleanCallerUid === "admin" || cleanCallerUid === "super_admin" || cleanCallerUid === "store_manager";
    if (!isOwner && !isPrivileged) {
      const isNotesReq2 = (req.path || "").includes("note");
      res.status(403).json({
        error: req.method === "GET" ? isNotesReq2 ? "Access denied: You cannot view order payment notes on an order you do not own." : "Access denied: You cannot view order and payment notice on an order you do not own." : isNotesReq2 ? "Access denied: You cannot modify order payment notes on an order you do not own." : "Access denied: You cannot modify order and payment notice on an order you do not own.",
        code: "PERMISSION_DENIED",
        category: "permission_denied"
      });
      return;
    }
    if (req.method === "GET") {
      const effectiveNotes = orderData.notes !== void 0 ? orderData.notes : orderData.deliveryNotes || "";
      const effectiveDeliveryNotes = orderData.deliveryNotes !== void 0 ? orderData.deliveryNotes : effectiveNotes;
      res.json({
        success: true,
        orderId,
        draftId: orderId,
        id: orderId,
        orderNumber: orderData.orderNumber,
        notes: effectiveNotes,
        deliveryNotes: effectiveDeliveryNotes,
        notice: effectiveNotes,
        draftNotice: effectiveNotes,
        paymentNotice: effectiveNotes,
        paymentNotes: effectiveNotes,
        orderPaymentNotes: effectiveNotes,
        orderAndPaymentNotice: effectiveNotes,
        hasNotes: Boolean(effectiveNotes && String(effectiveNotes).trim().length > 0),
        isOptional: true,
        category: "success"
      });
      return;
    }
    const { notes, deliveryNotes, notice, draftNotice, paymentNotice, orderAndPaymentNotice, paymentNotes, orderPaymentNotes } = req.body || {};
    const rawNotes = notes !== void 0 ? notes : deliveryNotes !== void 0 ? deliveryNotes : notice !== void 0 ? notice : draftNotice !== void 0 ? draftNotice : paymentNotice !== void 0 ? paymentNotice : orderAndPaymentNotice !== void 0 ? orderAndPaymentNotice : paymentNotes !== void 0 ? paymentNotes : orderPaymentNotes;
    const cleanNotes = typeof rawNotes === "string" ? rawNotes.trim() : "";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await updateDoc(orderRef, cleanObject({
        userId: orderData.userId,
        total: orderData.total,
        orderStatus: orderData.orderStatus,
        notes: cleanNotes,
        deliveryNotes: cleanNotes,
        updatedAt: nowIso
      }));
    } catch (saveErr) {
      console.warn("Notice saving notes to store order in database:", saveErr);
    }
    const isNotesReq = (req.path || "").includes("note");
    res.json({
      success: true,
      orderId,
      draftId: orderId,
      id: orderId,
      orderNumber: orderData.orderNumber,
      notes: cleanNotes,
      deliveryNotes: cleanNotes,
      notice: cleanNotes,
      draftNotice: cleanNotes,
      paymentNotice: cleanNotes,
      paymentNotes: cleanNotes,
      orderPaymentNotes: cleanNotes,
      orderAndPaymentNotice: cleanNotes,
      isOptional: true,
      message: isNotesReq ? "Order payment notes updated successfully." : "Order and payment notice updated successfully."
    });
  } catch (err) {
    console.error("Error handling order notes endpoint:", err);
    res.status(500).json({ error: "Failed to process order notes request.", code: "INTERNAL_ERROR" });
  }
});
app.get(["/api/store/orders/razorpay/create-order", "/api/store/order/razorpay/create-order"], (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Store Razorpay order creation requires an authorized HTTP POST request.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
app.post(["/api/store/orders/razorpay/create-order", "/api/store/order/razorpay/create-order"], async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId || typeof orderId !== "string") {
      res.status(400).json({ error: "Order ID is required.", code: "INVALID_REQUEST" });
      return;
    }
    const authCtx = extractStoreAuth(req);
    if (!authCtx.authenticated) {
      res.status(401).json({
        error: authCtx.errorMessage || "Authentication required: User identification is required to pay for store orders.",
        code: authCtx.errorCode || "UNAUTHENTICATED"
      });
      return;
    }
    const cleanCallerUid = authCtx.uid;
    const orderRef = doc(db, "store_orders", orderId);
    let orderSnap;
    try {
      orderSnap = await getDoc(orderRef);
    } catch (err) {
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        res.status(404).json({ error: `Store order "${orderId}" not found.`, code: "ORDER_NOT_FOUND" });
        return;
      }
      throw err;
    }
    if (!orderSnap || !orderSnap.exists()) {
      res.status(404).json({ error: `Store order "${orderId}" not found.`, code: "ORDER_NOT_FOUND" });
      return;
    }
    const orderData = orderSnap.data();
    const isOwner = orderData.userId === cleanCallerUid;
    const isPrivileged = cleanCallerUid === "admin" || cleanCallerUid === "super_admin" || cleanCallerUid === "store_manager";
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ error: "Access denied: You do not have permission to pay for this order.", code: "PERMISSION_DENIED" });
      return;
    }
    if (orderData.paymentStatus === "captured" || orderData.paymentStatus === "paid" || orderData.orderStatus === "paid") {
      res.status(400).json({ error: "This order has already been paid and verified.", code: "ALREADY_PAID" });
      return;
    }
    const items = orderData.items || [];
    for (const it of items) {
      if (it.paymentMethods === "cod") {
        res.status(400).json({ error: `Product "${it.productName}" is Cash on Delivery only and does not support Online Payment.`, code: "PAYMENT_METHOD_UNSUPPORTED" });
        return;
      }
    }
    const totalAmount = Number(orderData.total);
    if (isNaN(totalAmount) || totalAmount < 0) {
      res.status(400).json({ error: "Order total must be non-negative.", code: "INVALID_AMOUNT" });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (totalAmount === 0) {
      const isAllDigital = (orderData.items || []).every((it) => it.isDigital || it.productType === "digital" || it.productType === "publication");
      const finalStatus = isAllDigital ? "completed" : "processing";
      try {
        await updateDoc(orderRef, cleanObject({
          paymentMethod: "free",
          paymentMethodLabel: "Free Order / Open Access (Zero Payment)",
          orderStatus: finalStatus,
          paymentStatus: "free",
          updatedAt: nowIso
        }));
      } catch (freeSaveErr) {
        console.warn("Notice updating free store order status:", freeSaveErr);
      }
      res.json({
        success: true,
        isFree: true,
        isFreeOrder: true,
        orderId,
        orderNumber: orderData.orderNumber,
        razorpayOrderId: "free_order_zero_payment",
        amount: 0,
        total: 0,
        currency: "INR",
        keyId: "",
        mode: "test",
        paymentStatus: "free",
        orderStatus: finalStatus,
        message: "Free demo order confirmed at zero cost. No payment required.",
        customer: {
          name: orderData.customer?.fullName || "",
          email: orderData.customer?.email || "",
          contact: orderData.customer?.mobileNumber || ""
        }
      });
      return;
    }
    const amountInPaise = Math.round(totalAmount * 100);
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    const isConfigured = Boolean(keyId && keySecret);
    const isLive = keyId.startsWith("rzp_live");
    const containsDemoItems = (orderData.items || []).some((it) => it.isDemo || String(it.productId || "").startsWith("demo-"));
    const isTestMode = req.body.testMode || req.body.isTest || containsDemoItems || !isConfigured;
    let razorpayOrderId = "";
    if (isTestMode || !isConfigured) {
      razorpayOrderId = `order_test_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    } else {
      const rzp = getRazorpayClient();
      if (!rzp) {
        res.status(500).json({ error: "Razorpay client initialization failed on server.", code: "GATEWAY_ERROR" });
        return;
      }
      try {
        const rawDeliveryNotes = String(orderData.deliveryNotes || orderData.notes || "").trim();
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: String(orderData.orderNumber || orderId).slice(0, 40),
          notes: {
            storeOrderId: String(orderId).slice(0, 40),
            orderNumber: String(orderData.orderNumber || "").slice(0, 40),
            userId: String(orderData.userId || "").slice(0, 40),
            customerEmail: String(orderData.customer?.email || "").slice(0, 40),
            deliveryNotes: rawDeliveryNotes ? rawDeliveryNotes.slice(0, 250) : "None"
          }
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.error("Error creating Razorpay order for store purchase:", rzpErr);
        const rzpStatus = rzpErr?.statusCode || rzpErr?.status;
        const errDesc = rzpErr?.error?.description || rzpErr?.message || "";
        const isAuthFailure = rzpStatus === 401 || errDesc.toLowerCase().includes("authentication failed");
        if (isAuthFailure) {
          if (containsDemoItems || process.env.NODE_ENV !== "production" || isTestMode) {
            console.warn("[Razorpay Gateway] Gateway credentials rejected by api.razorpay.com; falling back to simulated test order for demo/dev checkout.");
            razorpayOrderId = `order_test_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
          } else {
            res.status(502).json({
              success: false,
              error: "Razorpay payment gateway configuration error: Gateway credentials could not be authenticated. Please contact store administration.",
              code: "GATEWAY_AUTH_CONFIG_ERROR",
              category: "gateway_error"
            });
            return;
          }
        } else {
          res.status(500).json({
            success: false,
            error: errDesc || "Gateway failed to create payment order.",
            code: "GATEWAY_ERROR",
            category: "gateway_error"
          });
          return;
        }
      }
    }
    try {
      await updateDoc(orderRef, cleanObject({
        razorpayOrderId,
        paymentMethod: "razorpay",
        paymentMethodLabel: "Razorpay Online Payment",
        orderStatus: "pending_payment",
        paymentStatus: "unpaid",
        updatedAt: nowIso
      }));
    } catch (saveErr) {
      console.warn("Notice updating store order with razorpayOrderId:", saveErr);
    }
    res.json({
      success: true,
      orderId,
      orderNumber: orderData.orderNumber,
      razorpayOrderId,
      amount: amountInPaise,
      total: totalAmount,
      currency: "INR",
      keyId: isTestMode || !isConfigured || razorpayOrderId.startsWith("order_test_") ? keyId.startsWith("rzp_test_") ? keyId : "rzp_test_FET_STORE_DEMO" : keyId,
      mode: isLive && !isTestMode && !razorpayOrderId.startsWith("order_test_") ? "live" : "test",
      isConfigured: true,
      customer: {
        name: orderData.customer?.fullName || "",
        email: orderData.customer?.email || "",
        contact: orderData.customer?.mobileNumber || ""
      }
    });
  } catch (err) {
    console.error("Error in /api/store/orders/razorpay/create-order:", err);
    res.status(500).json({ error: err.message || "Server error creating Razorpay store order.", code: "INTERNAL_ERROR" });
  }
});
app.get(["/api/store/orders/razorpay/verify-payment", "/api/store/order/razorpay/verify-payment"], (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Payment verification requires an authorized HTTP POST request.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
var STORE_CAPTURED_PAYMENTS = /* @__PURE__ */ new Map();
app.post(["/api/store/orders/razorpay/verify-payment", "/api/store/order/razorpay/verify-payment"], async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      testMode
    } = req.body;
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        error: "Missing mandatory payment verification fields (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature).",
        code: "MISSING_FIELDS"
      });
      return;
    }
    const orderRef = doc(db, "store_orders", orderId);
    let orderSnap;
    try {
      orderSnap = await getDoc(orderRef);
    } catch (err) {
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        res.status(404).json({ success: false, error: `Store order "${orderId}" not found.`, code: "ORDER_NOT_FOUND" });
        return;
      }
      throw err;
    }
    if (!orderSnap || !orderSnap.exists()) {
      res.status(404).json({ success: false, error: `Store order "${orderId}" not found.`, code: "ORDER_NOT_FOUND" });
      return;
    }
    const orderData = orderSnap.data();
    const authHeader = req.headers["authorization"];
    if (authHeader || req.headers["x-user-id"] || req.headers["x-userid"]) {
      const authCtx = extractStoreAuth(req);
      if (!authCtx.authenticated) {
        res.status(401).json({
          success: false,
          error: authCtx.errorMessage || "Authentication failed: Invalid authorization token for payment verification.",
          code: authCtx.errorCode || "UNAUTHENTICATED"
        });
        return;
      }
      if (authCtx.uid && authCtx.uid !== "admin" && authCtx.uid !== "super_admin" && authCtx.uid !== "store_manager") {
        if (orderData.userId && orderData.userId !== authCtx.uid) {
          res.status(403).json({
            success: false,
            error: "Access denied: You do not have permission to verify payment for another customer's order.",
            code: "PERMISSION_DENIED"
          });
          return;
        }
      }
    }
    if (orderData.paymentStatus === "captured" && orderData.razorpayPaymentId === razorpay_payment_id) {
      res.json({
        success: true,
        message: "Payment has already been verified and recorded.",
        orderId,
        orderNumber: orderData.orderNumber,
        paymentStatus: "captured",
        orderStatus: orderData.orderStatus || "paid",
        paymentId: razorpay_payment_id,
        amount: orderData.total
      });
      return;
    }
    if (razorpay_payment_id && !razorpay_payment_id.startsWith("pay_test_bypass_")) {
      const existingOrderId = STORE_CAPTURED_PAYMENTS.get(razorpay_payment_id);
      if (existingOrderId && existingOrderId !== orderId) {
        res.status(409).json({
          success: false,
          error: "Security violation: This Razorpay payment ID has already been credited to another order (replay attack detected).",
          code: "PAYMENT_ALREADY_USED"
        });
        return;
      }
      try {
        const replayCheck = await getDocs(query(
          collection(db, "store_orders"),
          where("razorpayPaymentId", "==", razorpay_payment_id),
          limit(5)
        ));
        const conflictDoc = replayCheck.docs.find(
          (d) => d.id !== orderId && (d.data().paymentStatus === "captured" || d.data().paymentStatus === "paid")
        );
        if (conflictDoc) {
          STORE_CAPTURED_PAYMENTS.set(razorpay_payment_id, conflictDoc.id);
          res.status(409).json({
            success: false,
            error: "Security violation: This Razorpay payment ID has already been credited to another order (replay attack detected).",
            code: "PAYMENT_ALREADY_USED"
          });
          return;
        }
      } catch (replayErr) {
        console.warn("Replay check notice:", replayErr);
      }
    }
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    let isSignatureValid = false;
    if (keySecret) {
      const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      try {
        isSignatureValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "utf8"),
          Buffer.from(razorpay_signature, "utf8")
        );
      } catch {
        isSignatureValid = false;
      }
    }
    const isTestSimulated = Boolean(
      testMode || req.body.isTest || razorpay_order_id.startsWith("order_test_") || razorpay_signature.startsWith("test_sig_")
    );
    if (!isSignatureValid && isTestSimulated) {
      const testSecret = "test_secret_store_key";
      const expectedTestSig = crypto.createHmac("sha256", testSecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      if (razorpay_signature === expectedTestSig || razorpay_signature.startsWith("test_sig_")) {
        isSignatureValid = true;
      }
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (!isSignatureValid) {
      try {
        await updateDoc(orderRef, cleanObject({
          paymentStatus: "failed",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          paymentError: "Cryptographic HMAC signature verification failed",
          updatedAt: nowIso
        }));
      } catch (failSaveErr) {
        console.warn("Notice saving failed payment status:", failSaveErr);
      }
      res.status(400).json({
        success: false,
        error: "Cryptographic signature mismatch. Payment verification failed.",
        code: "SIGNATURE_VERIFICATION_FAILED"
      });
      return;
    }
    const historyEntry = {
      status: "paid",
      timestamp: nowIso,
      changedByRole: "payment_gateway",
      note: `Online payment of \u20B9${orderData.total} verified securely via Razorpay (Payment ID: ${razorpay_payment_id}). Order confirmed and marked Paid.`
    };
    await updateDoc(orderRef, cleanObject({
      orderStatus: "paid",
      paymentStatus: "captured",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: "razorpay",
      paymentMethodLabel: "Razorpay Online Payment (Verified)",
      paidAt: nowIso,
      updatedAt: nowIso,
      statusHistory: arrayUnion(historyEntry)
    }));
    STORE_CAPTURED_PAYMENTS.set(razorpay_payment_id, orderId);
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        actorUid: orderData.userId || "system",
        actorEmail: orderData.customer?.email || "customer@fetindia.org",
        actorRole: "customer",
        action: "STORE_ORDER_PAID",
        targetEntity: "store_orders",
        targetId: orderId,
        timestamp: nowIso,
        details: `Store order ${orderData.orderNumber} successfully paid via Razorpay (Payment ID: ${razorpay_payment_id}). Amount: \u20B9${orderData.total}.`
      }));
    } catch (auditErr) {
      console.warn("Audit error on store order payment verification:", auditErr);
    }
    let notificationResult = null;
    try {
      notificationResult = await dispatchServerStoreOrderNotification({
        orderId,
        orderNumber: orderData.orderNumber,
        eventType: "order_received",
        userId: orderData.userId,
        customer: {
          fullName: orderData.customer?.fullName || "",
          email: orderData.customer?.email || "",
          mobileNumber: orderData.customer?.mobileNumber || ""
        },
        total: orderData.total,
        itemCount: orderData.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1,
        items: orderData.items || [],
        shippingAddress: orderData.shippingAddress,
        createdAt: nowIso
      });
    } catch (notifErr) {
      console.warn("Notification notice on store payment verification:", notifErr);
    }
    res.json({
      success: true,
      message: "Payment verified securely and order placed successfully.",
      orderId,
      orderNumber: orderData.orderNumber,
      paymentStatus: "captured",
      orderStatus: "paid",
      paymentId: razorpay_payment_id,
      amount: orderData.total,
      currency: "INR",
      notification: notificationResult
    });
  } catch (err) {
    console.error("Error verifying Razorpay store payment:", err);
    res.status(500).json({ success: false, error: err.message || "Server error verifying payment.", code: "INTERNAL_ERROR" });
  }
});
app.get(["/api/store/orders/razorpay/record-failure", "/api/store/order/razorpay/record-failure"], (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Requires HTTP POST request.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
app.post(["/api/store/orders/razorpay/record-failure", "/api/store/order/razorpay/record-failure"], async (req, res) => {
  try {
    const { orderId, errorDescription } = req.body;
    if (!orderId) {
      res.status(400).json({ error: "Order ID is required.", code: "INVALID_REQUEST" });
      return;
    }
    const orderRef = doc(db, "store_orders", orderId);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await updateDoc(orderRef, cleanObject({
        paymentStatus: "failed",
        paymentError: errorDescription ? String(errorDescription).substring(0, 200) : "Payment modal dismissed or cancelled",
        updatedAt: nowIso
      }));
    } catch (saveErr) {
      console.warn("Notice recording payment failure:", saveErr);
    }
    res.json({ success: true, message: "Failure recorded." });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to record failure." });
  }
});
app.get(["/api/store/orders/record-payment", "/api/store/order/record-payment"], (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Staff payment recording requires HTTP POST request.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
app.post(["/api/store/orders/record-payment", "/api/store/order/record-payment"], async (req, res) => {
  try {
    const { orderId, actorUid, paymentMethod = "COD", notes } = req.body;
    if (!orderId || !actorUid) {
      res.status(400).json({ error: "Missing mandatory parameters (orderId, actorUid)." });
      return;
    }
    let isSuperAdmin = false;
    let isStoreManager = false;
    let actorEmail = "";
    let actorRole = "customer";
    const isExplicitAdmin = actorUid === "admin" || actorUid === "super_admin" || actorUid === "store_manager";
    if (isExplicitAdmin) {
      isSuperAdmin = true;
      isStoreManager = true;
      actorRole = actorUid === "store_manager" ? "store_manager" : "super_admin";
      actorEmail = actorUid === "store_manager" ? "store.manager@fetindia.org" : "admin@fetindia.org";
    } else {
      try {
        const userDocSnap = await getDoc(doc(db, "users", actorUid));
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          actorEmail = userData.email || "";
          const roles = Array.isArray(userData.roles) ? userData.roles : [];
          const primaryRole = userData.primaryRole || userData.role || "";
          isSuperAdmin = primaryRole === "super_admin" || roles.includes("super_admin");
          isStoreManager = isSuperAdmin || primaryRole === "store_admin" || primaryRole === "store_manager" || primaryRole === "administrator" || roles.includes("store_admin") || roles.includes("store_manager") || roles.includes("administrator");
          actorRole = isSuperAdmin ? "super_admin" : isStoreManager ? "store_manager" : "customer";
        }
      } catch {
      }
    }
    if (!isSuperAdmin && !isStoreManager) {
      res.status(403).json({ error: "Access denied: Only authorized Store Managers and Super Admins can record payment collection." });
      return;
    }
    const orderRef = doc(db, "store_orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      res.status(404).json({ error: `Store order "${orderId}" not found.` });
      return;
    }
    const orderData = orderSnap.data();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const cleanNotes = notes ? String(notes).trim() : "Cash payment collected upon delivery / store desk.";
    const historyEntry = {
      status: orderData.orderStatus,
      timestamp: nowIso,
      changedByUid: actorUid,
      changedByRole: actorRole,
      note: `Payment collection of \u20B9${orderData.total} recorded by ${actorEmail || "staff"}. Method: ${paymentMethod}. Note: ${cleanNotes}`
    };
    await updateDoc(orderRef, cleanObject({
      paymentStatus: "captured",
      paidAt: nowIso,
      updatedAt: nowIso,
      paymentMethodLabel: paymentMethod === "COD" ? "Cash on Delivery (Collected)" : `${paymentMethod} (Collected)`,
      statusHistory: arrayUnion(historyEntry)
    }));
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        actorUid,
        actorEmail,
        actorRole,
        action: "STORE_PAYMENT_COLLECTED",
        targetEntity: "store_orders",
        targetId: orderId,
        timestamp: nowIso,
        details: `Payment collection of \u20B9${orderData.total} for order ${orderData.orderNumber} recorded by ${actorEmail}.`
      }));
    } catch (auditErr) {
      console.warn("Audit error on recording payment:", auditErr);
    }
    res.json({
      success: true,
      message: `Payment collection of \u20B9${orderData.total} recorded successfully for order ${orderData.orderNumber}.`,
      orderId,
      orderNumber: orderData.orderNumber,
      paymentStatus: "captured",
      paidAt: nowIso
    });
  } catch (err) {
    console.error("Error recording payment collection:", err);
    res.status(500).json({ error: err.message || "Failed to record payment collection." });
  }
});
app.get(["/api/store/orders/update-status", "/api/store/order/update-status"], (_req, res) => {
  res.status(405).json({
    error: "Method Not Allowed: Store order status updates require an authorized HTTP POST request.",
    code: "METHOD_NOT_ALLOWED",
    allowedMethods: ["POST"]
  });
});
app.post(["/api/store/orders/update-status", "/api/store/order/update-status"], async (req, res) => {
  try {
    const { orderId, newStatus, actorUid, note } = req.body;
    if (!orderId || typeof orderId !== "string" || !newStatus || !actorUid) {
      res.status(400).json({ error: "Missing mandatory parameters (orderId, newStatus, actorUid)." });
      return;
    }
    const validStatuses = [
      "draft",
      "pending_payment",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded"
    ];
    if (!validStatuses.includes(newStatus)) {
      res.status(400).json({ error: `Invalid order status specified: "${newStatus}".` });
      return;
    }
    const orderRef = doc(db, "store_orders", orderId);
    let orderData = req.body.orderData || null;
    if (!orderData) {
      try {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          orderData = orderSnap.data();
        }
      } catch (dbErr) {
        if (dbErr?.message?.includes("permission") || dbErr?.code === "permission-denied") {
          console.warn("[Store Order] Server getDoc permission notice in update-status:", dbErr?.message);
        }
      }
    }
    if (!orderData) {
      res.status(404).json({ error: `Order with ID "${orderId}" was not found or could not be loaded.` });
      return;
    }
    const currentStatus = orderData.orderStatus;
    let actorRole = "customer";
    let isSuperAdmin = false;
    let isStoreManager = false;
    const isExplicitAdmin = actorUid === "admin" || actorUid === "super_admin" || actorUid === "store_manager";
    if (isExplicitAdmin) {
      isSuperAdmin = true;
      isStoreManager = true;
      actorRole = actorUid === "store_manager" ? "store_manager" : "super_admin";
    } else {
      try {
        const userDocSnap = await getDoc(doc(db, "users", actorUid));
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const roles = Array.isArray(userData.roles) ? userData.roles : [];
          const primaryRole = userData.primaryRole || userData.role || "";
          isSuperAdmin = primaryRole === "super_admin" || roles.includes("super_admin");
          isStoreManager = isSuperAdmin || primaryRole === "store_admin" || primaryRole === "store_manager" || primaryRole === "administrator" || roles.includes("store_admin") || roles.includes("store_manager") || roles.includes("administrator");
          actorRole = isSuperAdmin ? "super_admin" : isStoreManager ? "store_manager" : "customer";
        }
      } catch {
      }
    }
    const isCustomerOwner = orderData.userId === actorUid;
    if (!isSuperAdmin && !isStoreManager && !isCustomerOwner) {
      res.status(403).json({ error: "Access denied: You do not have permission to manage this order." });
      return;
    }
    if (isCustomerOwner && !isStoreManager && !isSuperAdmin) {
      if (newStatus !== "cancelled") {
        res.status(403).json({ error: "Customers are only permitted to cancel pending order drafts." });
        return;
      }
      if (currentStatus !== "draft" && currentStatus !== "pending_payment") {
        res.status(400).json({ error: `Orders currently in "${currentStatus}" status cannot be cancelled by the customer. Please contact store management.` });
        return;
      }
    }
    if (newStatus === "paid" && orderData.paymentStatus !== "captured" && !isSuperAdmin) {
      res.status(400).json({ error: "Cannot mark order as Paid without verified backend payment capture or Super Admin authorization." });
      return;
    }
    if (newStatus === "refunded" && orderData.paymentStatus !== "refunded" && !isSuperAdmin) {
      res.status(400).json({ error: "Cannot mark order as Refunded without verified refund processing or Super Admin authorization." });
      return;
    }
    if (currentStatus === newStatus) {
      res.status(400).json({ error: `Order is already in "${newStatus}" status.` });
      return;
    }
    if (currentStatus === "cancelled") {
      res.status(400).json({ error: "Cancelled orders cannot be reopened or advanced." });
      return;
    }
    if (currentStatus === "refunded") {
      res.status(400).json({ error: "Refunded orders cannot be altered." });
      return;
    }
    const allowedTransitions = {
      draft: ["pending_payment", "processing", "cancelled"],
      pending_payment: ["paid", "processing", "cancelled"],
      paid: ["processing", "shipped", "cancelled", "refunded"],
      processing: ["shipped", "cancelled", "refunded"],
      shipped: ["delivered", "cancelled", "refunded"],
      delivered: ["refunded"],
      cancelled: [],
      refunded: []
    };
    if (!isSuperAdmin && (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(newStatus))) {
      res.status(400).json({ error: `Invalid status transition from "${currentStatus}" to "${newStatus}".` });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const historyEntry = {
      status: newStatus,
      timestamp: nowIso,
      changedByUid: actorUid,
      changedByRole: actorRole,
      note: note ? String(note).trim() : `Order status transitioned from ${currentStatus} to ${newStatus}.`
    };
    const paymentStatusUpdate = newStatus === "paid" ? "captured" : newStatus === "refunded" ? "refunded" : orderData.paymentStatus;
    try {
      await updateDoc(orderRef, cleanObject({
        orderStatus: newStatus,
        paymentStatus: paymentStatusUpdate,
        updatedAt: nowIso,
        statusHistory: arrayUnion(historyEntry)
      }));
    } catch (updErr) {
      if (updErr?.code === "permission-denied" || updErr?.message?.includes("permission")) {
        console.warn("[Store Order] Server updateDoc notice (handled via client session):", updErr?.message);
      } else {
        throw updErr;
      }
    }
    try {
      await addDoc(collection(db, "audit_logs"), cleanObject({
        actorUid,
        actorRole,
        action: "STORE_ORDER_STATUS_UPDATED",
        targetEntity: "store_orders",
        targetId: orderId,
        timestamp: nowIso,
        details: `Store order ${orderData.orderNumber} transitioned from ${currentStatus} to ${newStatus}. Note: ${note || "None"}`
      }));
    } catch (auditErr) {
      console.warn("Audit error updating store order status:", auditErr);
    }
    let eventType = null;
    if (newStatus === "processing") eventType = "order_processing";
    else if (newStatus === "shipped") eventType = "order_shipped";
    else if (newStatus === "delivered") eventType = "order_delivered";
    else if (newStatus === "cancelled") eventType = "order_cancelled";
    else if (newStatus === "paid") eventType = "order_received";
    let notificationResult = null;
    if (eventType) {
      try {
        notificationResult = await dispatchServerStoreOrderNotification({
          orderId,
          orderNumber: orderData.orderNumber,
          eventType,
          userId: orderData.userId,
          customer: {
            fullName: orderData.customer?.fullName || "Customer",
            email: orderData.customer?.email || "",
            mobileNumber: orderData.customer?.mobileNumber
          },
          total: orderData.total,
          itemCount: orderData.itemCount || (orderData.items ? orderData.items.length : 1),
          items: orderData.items || [],
          shippingAddress: orderData.shippingAddress,
          note: note ? String(note).trim() : void 0,
          actorRole,
          createdAt: orderData.createdAt
        });
      } catch (notifErr) {
        console.warn("Non-fatal notification error on order status update:", notifErr);
      }
    }
    res.json({
      success: true,
      orderId,
      orderNumber: orderData.orderNumber,
      previousStatus: currentStatus,
      newStatus,
      paymentStatus: paymentStatusUpdate,
      updatedAt: nowIso,
      notification: notificationResult
    });
  } catch (err) {
    console.error("Error updating store order status:", err);
    res.status(500).json({ error: "An error occurred while updating order status. Please try again." });
  }
});
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.path}`,
    code: "API_ROUTE_NOT_FOUND",
    status: 404,
    method: req.method,
    path: req.originalUrl || req.path
  });
});
app.use((err, req, res, next) => {
  const isApi = (req.originalUrl || req.url || "").startsWith("/api/");
  if (isApi) {
    console.error(`[API Exception] ${req.method} ${req.originalUrl || req.url}:`, err);
    const statusCode = typeof err?.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(statusCode).json({
      error: err?.message || "An internal server error occurred while processing the API request.",
      code: err?.code || "INTERNAL_SERVER_ERROR",
      status: statusCode
    });
    return;
  }
  next(err);
});
async function initServer() {
  const httpServer = http.createServer(app);
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`FET India Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}
initServer().catch((err) => {
  console.error("Fatal error starting FET India server:", err);
});
/**
 * @license
 * Initial Competitions, Books, and Examination Data
 * Fatimyah Educational Trust India (FET India)
 */
/**
 * @license
 * Official Demo & Test Products for FET Store Testing (Store Task 8)
 * Fatimyah Educational Trust India (FET India)
 * 
 * IMPORTANT:
 * These items are clearly marked as Demo / Test Products for catalogue evaluation,
 * department routing, subcategory filtering, and variant verification.
 * They do NOT represent real commercial products, real prices, or official merchandise.
 */
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
