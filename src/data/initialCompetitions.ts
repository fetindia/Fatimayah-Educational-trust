/**
 * @license
 * Initial Competitions, Books, and Examination Data
 * Fatimyah Educational Trust India (FET India)
 */

import { Competition } from '../types';

export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: 'cmp-1792513826744-5974',
    code: 'FET-CMP-2026-0064',
    title: 'Ayam-e-Fatimiyah Special Book Reading Competition 2026 — Fatima Zahra (Salaamun Alayha)',
    category: 'book_reading',
    categoryLabel: 'Book Reading Competition',
    description: 'Academic Vision\n\nThe Ayam-e-Fatimiyah Special Book Reading Competition, organized through FETIndia.com, aims to promote reading habits, religious and historical knowledge, moral values, and intellectual development among students and readers.\n\nBased on the Urdu book Fatima Zahra (Salaamun Alayha), this competition provides participants with an opportunity to explore the life, character, virtues, patience, knowledge, and teachings of Hazrat Fatima Zahra (S.A.).\n\nThe competition is organized in remembrance of Ayam-e-Fatimiyah, encouraging participants to deepen their understanding of Islamic history and reflect on the importance of faith, education, dignity, compassion, and good character.\n\nThrough this educational initiative, FETIndia.com seeks to make meaningful reading accessible to learners and encourage a lifelong love of books and knowledge.\n\nCompetition Objective: To encourage book reading, improve comprehension, strengthen historical understanding, and inspire participants to apply positive moral values in their daily lives.',
    eligibilityAgeMin: 12,
    eligibilityAgeMax: 22,
    eligibleClasses: ['Class 8th', 'Class 9th', 'Class 10th', 'Class 11th', 'Class 12th', 'Open category'],
    eligibleStates: ['All India'],
    eligibleDistricts: ['All Districts'],
    registrationStartDate: '2026-10-20',
    registrationEndDate: '2026-11-07',
    competitionDate: '2026-11-08',
    examScheduleDate: '2026-11-08',
    openingTime: '09:00',
    closingTime: '10:00',
    timeZone: 'Asia/Kolkata',
    resultPublicationDate: '2026-11-15',
    maxParticipants: 2000,
    registeredCount: 1,
    maxMarks: 100,
    passingMarks: 40,
    isPaid: false,
    participationFee: 0,
    allowMultipleAttempts: false,
    autoEvaluateResults: true,
    autoPublishResults: true,
    rules: [
      'Candidate must bring official admit pass or login at the scheduled exam time.',
      'All answers must be the original, independent work of the candidate.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    pdfStoragePath: 'examination_materials/cmp-1792513826744-5974/1793096831161_fatimiyah_book_store__1___3_.pdf',
    pdfFileName: 'fatimiyah_book_store__1_ (3).pdf',
    pdfFileSizeBytes: 1729775,
    pdfSourceType: 'upload',
    pdfReadingMaterialUrl: '/api/competitions/cmp-1792513826744-5974/material',
    bookDetails: {
      bookTitle: 'Ayam-e-Fatimiyah Special Book Reading Competition 2026 — Fatima Zahra (Salaamun Alayha)',
      author: 'رہبر معظم سید علی خامنہ ای*حافظ اللہ',
      requiredChapters: 'all pages',
      pdfReadingMaterialUrl: '/api/competitions/cmp-1792513826744-5974/material',
      pdfFileName: 'fatimiyah_book_store__1_ (3).pdf',
      pdfFileSizeBytes: 1729775,
      pdfStoragePath: 'examination_materials/cmp-1792513826744-5974/1793096831161_fatimiyah_book_store__1___3_.pdf',
      pdfSourceType: 'upload'
    },
    examDetails: {
      isOnlineExam: true,
      paperCode: 'FET-PPR-BR-2026',
      paperTitle: 'National Book Reading Assessment Paper 2026',
      durationMinutes: 45,
      totalMarks: 100,
      passingMarks: 40,
      supportedLanguages: ['en', 'ur', 'hi'],
      defaultLanguage: 'en',
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
        'Read each question carefully in your preferred language (English, Urdu, or Hindi).',
        'Section A comprises Objective Comprehension MCQs (60 Marks).',
        'Section B comprises Critical Analytical Synthesis (40 Marks).',
        'Do not switch browser tabs or exit fullscreen mode. Violations will be recorded.'
      ],
      sections: [
        {
          id: 'sec-br-a',
          sectionCode: 'Section A',
          title: 'Objective Comprehension & Historical Context',
          description: 'Objective MCQs based on Chapters 1 through 6 of the prescribed reading.',
          totalMarks: 60,
          passingMarks: 24,
          questions: [
            {
              id: 'q-br-1',
              questionText: 'What foundational ethical principle did the author emphasize as essential for scientific progress and national service in Chapter 2?',
              primaryLanguage: 'en',
              translations: {
                ur: {
                  language: 'ur',
                  questionText: 'مصنف نے باب دوم میں سائنسی ترقی اور قومی خدمت کے لیے کس بنیادی اخلاقی اصول کو سب سے اہم قرار دیا ہے؟',
                  options: [
                    'دیانت داری، مسلسل جستجو، اور عوامی فلاح کے لیے بے لوث وابستگی',
                    'صرف تجارتی منافع اور کاروباری تسلط کا حصول',
                    'سماجی مسائل سے کنارہ کشی اور محض نظریاتی بحث',
                    'بغیر جدت کے پرانے دفتری طریقہ کار پر سختی سے عمل'
                  ],
                  explanation: 'متن میں دیانت داری اور بے لوث خدمت کو بااثر سائنسی ترقی کی بنیادی قدر قرار دیا گیا ہے۔',
                  direction: 'rtl'
                },
                hi: {
                  language: 'hi',
                  questionText: 'अध्याय 2 में लेखक ने वैज्ञानिक प्रगति और राष्ट्रीय सेवा के लिए किस मूलभूत नैतिक सिद्धांत पर बल दिया है?',
                  options: [
                    'सत्यनिष्ठा, निरंतर अन्वेषण और जन कल्याण के लिए निस्वार्थ समर्पण',
                    'केवल व्यावसायिक लाभ और बाजार एकाधिकार की खोज',
                    'सामाजिक समस्याओं से अलगाव और केवल सैद्धांतिक अध्ययन',
                    'नवाचार के बिना पुरानी प्रक्रियाओं का अंधानुकरण'
                  ],
                  explanation: 'पाठ में सत्यनिष्ठा और निस्वार्थ सेवा को विज्ञान का मूल स्तंभ बताया गया है।',
                  direction: 'ltr'
                }
              },
              questionType: 'mcq',
              options: [
                'Integrity, persistent inquiry, and selfless dedication to community welfare',
                'Exclusive pursuit of commercial profitability and market monopoly',
                'Isolation from social issues and purely theoretical modeling',
                'Strict adherence to outdated procedural routines without innovation'
              ],
              correctOptionIndex: 0,
              marks: 20,
              negativeMarks: 5,
              difficulty: 'medium',
              bookMastery: {
                bookTitle: 'Wings of Fire & Ethical Horizons',
                chapterNumber: 2,
                chapterTitle: 'Early Scientific Endeavors',
                pageRange: 'pp. 45-52',
                topicTag: 'Scientific Ethics'
              },
              explanation: 'The text highlights integrity and selfless dedication as the core virtues of impactful science.'
            },
            {
              id: 'q-br-2',
              questionText: 'According to the prescribed chapters, how should young scholars navigate career setbacks and unexpected failures?',
              primaryLanguage: 'en',
              translations: {
                ur: {
                  language: 'ur',
                  questionText: 'تجویز کردہ ابواب کے مطابق، نوجوان محققین کو تعلیمی و پیشہ ورانہ ناکامیوں اور رکاوٹوں کا سامنا کیسے کرنا چاہیے؟',
                  options: [
                    'مشکل علمی اور تحقیقی سرگرمیوں کو فوری طور پر ترک کر کے',
                    'ناکامی کو تشخیص و رہنمائی سمجھ کر اور منظم حکمت عملی سے ثابت قدم رہ کر',
                    'سارا الزام صرف بیرونی دفتری مجبوریوں پر ڈال کر',
                    'بنیادی سائنسی اصولوں کو نظر انداز کر کے'
                  ],
                  direction: 'rtl'
                },
                hi: {
                  language: 'hi',
                  questionText: 'निर्धारित अध्यायों के अनुसार, युवा विद्यार्थियों को शैक्षणिक बाधाओं और अप्रत्याशित असफलताओं का सामना कैसे करना चाहिए?',
                  options: [
                    'कठिन शैक्षणिक प्रयासों को तुरंत छोड़कर',
                    'असफलता को नैदानिक सीख मानकर और व्यवस्थित समस्या निवारण से धैर्य रखकर',
                    'केवल बाहरी संगठनात्मक बाधाओं पर दोष मढ़कर',
                    'मौलिक वैज्ञानिक सिद्धांतों की उपेक्षा करके'
                  ],
                  direction: 'ltr'
                }
              },
              questionType: 'mcq',
              options: [
                'By abandoning challenging academic pursuits immediately',
                'By treating setbacks as diagnostic feedback and cultivating resilience through systematic problem-solving',
                'By placing blame solely on external organizational constraints',
                'By ignoring fundamental scientific laws'
              ],
              correctOptionIndex: 1,
              marks: 20,
              negativeMarks: 5,
              difficulty: 'medium',
              bookMastery: {
                bookTitle: 'Wings of Fire & Ethical Horizons',
                chapterNumber: 3,
                chapterTitle: 'Overcoming Setbacks',
                pageRange: 'pp. 82-88',
                topicTag: 'Resilience'
              },
              explanation: 'The author defines failure as learning feedback and urges proactive resilience.'
            },
            {
              id: 'q-br-3',
              questionText: 'In Chapter 5, what role does cultural harmony and mutual respect play in collaborative institutional breakthroughs?',
              primaryLanguage: 'en',
              translations: {
                ur: {
                  language: 'ur',
                  questionText: 'باب پنجم میں ادارہ جاتی سائنسی کامیابیوں کے حصول میں ثقافتی ہم آہنگی اور باہمی احترام کا کیا کردار بتایا گیا ہے؟',
                  options: [
                    'یہ مختلف ذہنوں کو اعلیٰ مقصد کے لیے متحد کرنے والے اہم سماجی تانے بانے کا کام کرتا ہے',
                    'اسے انفرادی تکنیکی برتری کے مقابلے میں ثانوی سمجھا جاتا ہے',
                    'اس کا سائنسی نتائج پر کوئی اثر نہیں ہوتا',
                    'یہ صرف رسمی تقریبات تک محدود ہوتا ہے'
                  ],
                  direction: 'rtl'
                },
                hi: {
                  language: 'hi',
                  questionText: 'अध्याय 5 में, संस्थागत वैज्ञानिक सफलताओं में सांस्कृतिक सद्भाव और पारस्परिक सम्मान की क्या भूमिका बताई गई है?',
                  options: [
                    'यह विविध विचारों को उच्च उद्देश्य के लिए एकजुट करने वाले जीवंत सामाजिक ताने-बाने के रूप में कार्य करता है',
                    'इसे व्यक्तिगत तकनीकी प्रभुत्व की तुलना में गौण माना जाता है',
                    'इसका वैज्ञानिक परिणामों पर कोई मापने योग्य प्रभाव नहीं पड़ता',
                    'यह केवल औपचारिक अवसरों तक ही सीमित है'
                  ],
                  direction: 'ltr'
                }
              },
              questionType: 'mcq',
              options: [
                'It serves as the vital social fabric enabling diverse minds to unite for higher purpose',
                'It is viewed as secondary to individual technical dominance',
                'It has no measurable influence on scientific outcomes',
                'It is restricted only to ceremonial occasions'
              ],
              correctOptionIndex: 0,
              marks: 20,
              negativeMarks: 5,
              difficulty: 'easy',
              bookMastery: {
                bookTitle: 'Wings of Fire & Ethical Horizons',
                chapterNumber: 5,
                chapterTitle: 'Cultural Harmony in Teams',
                pageRange: 'pp. 120-125',
                topicTag: 'Institutional Culture'
              },
              explanation: 'Diverse minds uniting with mutual respect foster breakthrough innovation.'
            }
          ]
        },
        {
          id: 'sec-br-b',
          sectionCode: 'Section B',
          title: 'Critical Analytical Synthesis & Essay',
          description: 'Descriptive analytical question evaluating critical synthesis and community vision.',
          totalMarks: 40,
          passingMarks: 16,
          questions: [
            {
              id: 'q-br-4',
              questionText: 'Provide a concise analytical synthesis (250-300 words): How can the educational philosophies and ethical leadership principles outlined in the text be implemented in underprivileged community schools today?',
              primaryLanguage: 'en',
              translations: {
                ur: {
                  language: 'ur',
                  questionText: 'جامع تجزیاتی مقالہ (250-300 الفاظ): متن میں بیان کردہ تعلیمی فلسفے اور اخلاقی قیادت کے اصولوں کو آج پسماندہ طبقات کے اسکولوں میں کس طرح عملی شکل دی جا سکتی ہے؟',
                  direction: 'rtl'
                },
                hi: {
                  language: 'hi',
                  questionText: 'संक्षिप्त विश्लेषणात्मक निबंध (250-300 शब्द): पाठ में वर्णित शैक्षणिक दर्शन और नैतिक नेतृत्व के सिद्धांतों को आज वंचित समुदाय के स्कूलों में कैसे लागू किया जा सकता है?',
                  direction: 'ltr'
                }
              },
              questionType: 'descriptive',
              marks: 40,
              difficulty: 'advanced',
              bookMastery: {
                bookTitle: 'Wings of Fire & Ethical Horizons',
                chapterNumber: 7,
                chapterTitle: 'Vision for Community Empowerment & Rural Science Literacy',
                pageRange: 'pp. 165-178',
                topicTag: 'Education Reform'
              },
              readingReference: 'Chapter 7: Vision for Community Empowerment & Rural Science Literacy',
              explanation: 'Evaluated on depth of pedagogical understanding, realism of implementation steps, and articulation.'
            }
          ]
        }
      ],
      questions: [
        {
          id: 'q-br-1',
          questionText: 'What foundational ethical principle did the author emphasize as essential for scientific progress and national service in Chapter 2?',
          questionType: 'mcq',
          options: [
            'Integrity, persistent inquiry, and selfless dedication to community welfare',
            'Exclusive pursuit of commercial profitability and market monopoly',
            'Isolation from social issues and purely theoretical modeling',
            'Strict adherence to outdated procedural routines without innovation'
          ],
          correctOptionIndex: 0,
          marks: 20,
          explanation: 'The text highlights integrity and selfless dedication as the core virtues of impactful science.'
        },
        {
          id: 'q-br-2',
          questionText: 'According to the prescribed chapters, how should young scholars navigate career setbacks and unexpected failures?',
          questionType: 'mcq',
          options: [
            'By abandoning challenging academic pursuits immediately',
            'By treating setbacks as diagnostic feedback and cultivating resilience through systematic problem-solving',
            'By placing blame solely on external organizational constraints',
            'By ignoring fundamental scientific laws'
          ],
          correctOptionIndex: 1,
          marks: 20,
          explanation: 'The author defines failure as learning feedback and urges proactive resilience.'
        },
        {
          id: 'q-br-3',
          questionText: 'In Chapter 5, what role does cultural harmony and mutual respect play in collaborative institutional breakthroughs?',
          questionType: 'mcq',
          options: [
            'It serves as the vital social fabric enabling diverse minds to unite for higher purpose',
            'It is viewed as secondary to individual technical dominance',
            'It has no measurable influence on scientific outcomes',
            'It is restricted only to ceremonial occasions'
          ],
          correctOptionIndex: 0,
          marks: 20,
          explanation: 'Diverse minds uniting with mutual respect foster breakthrough innovation.'
        },
        {
          id: 'q-br-4',
          questionText: 'Provide a concise analytical synthesis: How can the educational philosophies outlined in the text be implemented in underprivileged community schools today?',
          questionType: 'descriptive',
          marks: 40,
          readingReference: 'Chapter 7: Vision for Community Empowerment & Rural Science Literacy'
        }
      ]
    },
    prizeRewards: [
      {
        id: 'pz-br-1',
        rankPosition: 1,
        title: '1st National Rank - Kalam Memorial Gold Distinction',
        rewardAmount: 50000,
        rewardDescription: 'Gold Medal, Dell Latitude Core i7 Laptop, and ₹50,000 Academic Scholarship',
        rewardType: 'scholarship',
        winnerCount: 1,
        eligibilityInfo: 'National Rank #1 in combined objective & analytical assessment',
        status: 'active'
      },
      {
        id: 'pz-br-2',
        rankPosition: 2,
        title: '2nd - 5th National Ranks - Silver Distinction',
        rewardAmount: 25000,
        rewardDescription: 'Silver Medals, 10-inch Samsung Tablets, and ₹25,000 Study Grant',
        rewardType: 'scholarship',
        winnerCount: 4,
        eligibilityInfo: 'National Ranks #2 through #5',
        status: 'active'
      },
      {
        id: 'pz-br-3',
        rankPosition: 3,
        title: 'Top 100 Merit Scholars - Academic Citation',
        rewardAmount: 5000,
        rewardDescription: 'Certificate of Academic Merit and 1-Year FET Academic Mentorship',
        rewardType: 'certificate',
        winnerCount: 95,
        eligibilityInfo: 'Scoring 70% or above in qualifying examination',
        status: 'active'
      }
    ],
    prizesSummary: [
      '1st Rank: Gold Medal, Dell Latitude Core i7 Laptop, and ₹50,000 Academic Scholarship',
      '2nd-5th Rank: Silver Medals, 10-inch Samsung Tablets, and ₹25,000 Study Grant',
      'Top 100 Rank: Certificate of Academic Merit and 1-Year FET Academic Mentorship'
    ],
    status: 'registration_open',
    isPublished: true,
    createdByUid: 'system_admin',
    createdByEmail: 'fetkofficial@gmail.com',
    createdByName: 'FET Academic Governance Board',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z'
  },
  {
    id: 'cmp-stem-olympiad-2026',
    code: 'FET-CMP-2026-002',
    title: 'FET National STEM & Science Olympiad 2026',
    category: 'stem_olympiad',
    categoryLabel: 'National STEM Olympiad',
    description: 'Premier national competitive examination identifying and sponsoring mathematical prodigies, physics thinkers, and future engineers across standard 8th to 12th.',
    eligibilityAgeMin: 13,
    eligibilityAgeMax: 19,
    eligibleClasses: ['Class 8th', 'Class 9th', 'Class 10th', 'Class 11th Science', 'Class 12th Science'],
    eligibleStates: ['All India'],
    eligibleDistricts: ['All Districts'],
    registrationStartDate: '2026-06-01',
    registrationEndDate: '2026-09-15',
    competitionDate: '2026-10-18',
    resultPublicationDate: '2026-11-15',
    maxParticipants: 10000,
    registeredCount: 1420,
    maxMarks: 100,
    passingMarks: 50,
    rules: [
      'Exam will be conducted simultaneously in OMR format across 28 test centers and via digital portal.',
      'Scientific calculators are not permitted; rough sheets will be provided.',
      'Reporting time is 9:00 AM sharp at the assigned testing center.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    examDetails: {
      isOnlineExam: true,
      durationMinutes: 60,
      instructions: [
        'Section A covers Physics & Mathematics (40 Marks).',
        'Section B covers Logical Reasoning & Algorithmic Problem Solving (60 Marks).'
      ],
      questions: [
        {
          id: 'q-stem-1',
          questionText: 'A body starts from rest with uniform acceleration a = 4 m/s². What distance does it cover in the 5th second of its motion?',
          questionType: 'mcq',
          options: ['18 meters', '20 meters', '22 meters', '25 meters'],
          correctOptionIndex: 0,
          marks: 25,
          explanation: 'S_nth = u + a/2(2n-1) = 0 + 4/2(2*5 - 1) = 2(9) = 18 m.'
        },
        {
          id: 'q-stem-2',
          questionText: 'If log_2(x - 1) + log_2(x + 1) = 3, what is the real positive value of x?',
          questionType: 'mcq',
          options: ['3', '4', '5', '8'],
          correctOptionIndex: 0,
          marks: 25,
          explanation: 'log_2((x-1)(x+1)) = 3 => x^2 - 1 = 2^3 = 8 => x^2 = 9 => x = 3.'
        },
        {
          id: 'q-stem-3',
          questionText: 'Which law of thermodynamics establishes the concept of entropy and the natural direction of spontaneous thermal processes?',
          questionType: 'mcq',
          options: ['Zeroth Law', 'First Law', 'Second Law', 'Third Law'],
          correctOptionIndex: 2,
          marks: 25,
          explanation: 'The Second Law of Thermodynamics defines entropy and spontaneity.'
        },
        {
          id: 'q-stem-4',
          questionText: 'In computer science and graph theory, what is the minimum number of colors needed to color any planar graph such that no two adjacent vertices share the same color?',
          questionType: 'mcq',
          options: ['3 Colors', '4 Colors', '5 Colors', '6 Colors'],
          correctOptionIndex: 1,
          marks: 25,
          explanation: 'The Four Color Theorem proves that 4 colors are always sufficient for any planar map.'
        }
      ]
    },
    prizeRewards: [
      {
        id: 'pz-stem-1',
        rankPosition: 1,
        title: '1st National Rank - Ramanujan Science Scholar',
        rewardAmount: 100000,
        rewardDescription: '₹1,00,000 Cash Grant + HP Omen Workstation Laptop + Gold Medal',
        rewardType: 'scholarship',
        winnerCount: 1,
        eligibilityInfo: 'National Rank #1 in STEM Olympiad Assessment',
        status: 'active'
      },
      {
        id: 'pz-stem-2',
        rankPosition: 2,
        title: '2nd - 5th National Ranks - Silver Science Scholars',
        rewardAmount: 50000,
        rewardDescription: '₹50,000 Cash Grant + Silver Medal + Full Tuition Grant',
        rewardType: 'scholarship',
        winnerCount: 4,
        eligibilityInfo: 'Ranks 2 through 5',
        status: 'active'
      },
      {
        id: 'pz-stem-3',
        rankPosition: 3,
        title: 'Top 100 National STEM Laureates',
        rewardAmount: 15000,
        rewardDescription: '100% FET Higher Education Degree Sponsorship & Merit Citation',
        rewardType: 'scholarship',
        winnerCount: 95,
        eligibilityInfo: 'Top 100 Percentile in national assessment',
        status: 'active'
      }
    ],
    prizesSummary: [
      '1st Rank: ₹1,00,000 Cash Grant + HP Omen Workstation Laptop + Gold Medal',
      '2nd-5th Rank: ₹50,000 Cash Grant + Silver Medal + Full Tuition Grant',
      'Top 100: 100% FET Higher Education Degree Sponsorship'
    ],
    status: 'registration_open',
    isPublished: true,
    createdByUid: 'system_admin',
    createdByEmail: 'fetkofficial@gmail.com',
    createdByName: 'FET Science Olympiad Directorate',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z'
  },
  {
    id: 'cmp-islamic-studies-2026',
    code: 'FET-CMP-2026-003',
    title: 'All-India Islamic History, Ethics & Constitutional Values Challenge 2026',
    category: 'islamic_studies',
    categoryLabel: 'Islamic Studies & Moral Ethics',
    description: 'Promoting historical literacy, ethical philosophy, and constitutional civic harmony through competitive scholarly assessment.',
    eligibilityAgeMin: 14,
    eligibilityAgeMax: 30,
    eligibleClasses: ['High School', 'Higher Secondary', 'Undergraduate', 'Postgraduate', 'Madrasa Scholars'],
    eligibleStates: ['All India'],
    eligibleDistricts: ['All Districts'],
    registrationStartDate: '2026-05-01',
    registrationEndDate: '2026-08-15',
    competitionDate: '2026-08-25',
    resultPublicationDate: '2026-08-30',
    maxParticipants: 3000,
    registeredCount: 890,
    maxMarks: 100,
    passingMarks: 45,
    rules: [
      'Assessment covers Quranic ethics of justice, historical contribution of Indian Muslim freedom fighters, and Indian constitutional pluralism.',
      'Language options: English, Urdu, Hindi, and Marathi.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    examDetails: {
      isOnlineExam: true,
      durationMinutes: 40,
      questions: [
        {
          id: 'q-is-1',
          questionText: 'Which historical charter enacted in early Islamic governance is celebrated internationally as the first written constitutional agreement ensuring multi-faith civic equality?',
          questionType: 'mcq',
          options: [
            'Charter of Medina (Misaq-e-Madina)',
            'Treaty of Hudaybiyyah',
            'Pact of Umar',
            'Edict of Milan'
          ],
          correctOptionIndex: 0,
          marks: 30,
          explanation: 'Misaq-e-Madina (622 CE) established equal citizenship rights and mutual defense across diverse communities.'
        },
        {
          id: 'q-is-2',
          questionText: 'Which prominent freedom fighter and Islamic scholar served as independent India’s first Education Minister and founded the Indian Institutes of Technology (IITs) and UGC?',
          questionType: 'mcq',
          options: [
            'Maulana Abul Kalam Azad',
            'Dr. Zakir Husain',
            'Maulana Mohammad Ali Jauhar',
            'Hakim Ajmal Khan'
          ],
          correctOptionIndex: 0,
          marks: 35,
          explanation: 'Maulana Abul Kalam Azad was India’s first Education Minister and father of modern higher education institutes.'
        },
        {
          id: 'q-is-3',
          questionText: 'What is the core Quranic injunction regarding universal human dignity articulated in Surah Al-Isra (17:70)?',
          questionType: 'mcq',
          options: [
            '"And We have certainly honored the children of Adam (all humanity)"',
            'Honor is reserved exclusively for a single tribe',
            'Material wealth is the sole determinant of human worth',
            'Dignity depends on geographic birthplace'
          ],
          correctOptionIndex: 0,
          marks: 35,
          explanation: 'Surah Al-Isra 17:70 establishes universal human dignity bestowed upon all human beings without discrimination.'
        }
      ]
    },
    prizeRewards: [
      {
        id: 'pz-is-1',
        rankPosition: 1,
        title: '1st Rank - Allama Iqbal Gold Shield & Research Award',
        rewardAmount: 75000,
        rewardDescription: '₹75,000 Cash Award + Allama Iqbal Gold Shield + Library Grant',
        rewardType: 'scholarship',
        winnerCount: 1,
        eligibilityInfo: 'Top National Score',
        status: 'active'
      },
      {
        id: 'pz-is-2',
        rankPosition: 2,
        title: '2nd - 3rd Rank - Silver Shield Distinction',
        rewardAmount: 35000,
        rewardDescription: '₹35,000 Cash Award + Silver Shield',
        rewardType: 'scholarship',
        winnerCount: 2,
        eligibilityInfo: '2nd and 3rd rank holders',
        status: 'active'
      },
      {
        id: 'pz-is-3',
        rankPosition: 3,
        title: 'Merit Winners - Scholarly Excellence',
        rewardAmount: 10000,
        rewardDescription: 'Certificate of Scholarly Excellence & Reference Book Hamper',
        rewardType: 'certificate',
        winnerCount: 25,
        eligibilityInfo: 'Scoring above 75% marks',
        status: 'active'
      }
    ],
    prizesSummary: [
      '1st Rank: ₹75,000 Cash Award + Allama Iqbal Gold Shield + Library Grant',
      '2nd-3rd Rank: ₹35,000 Cash Award + Silver Shield',
      'Merit Winners: Certificate of Scholarly Excellence'
    ],
    status: 'archived',
    isPublished: false,
    isDeleted: true,
    resultsApprovedAt: '2026-08-29T18:00:00Z',
    resultsApprovedByUid: 'system_admin',
    resultsApprovedByEmail: 'fetkofficial@gmail.com',
    resultsPublishedAt: '2026-08-30T09:00:00Z',
    resultsPublishedByUid: 'system_admin',
    createdByUid: 'system_admin',
    createdByEmail: 'fetkofficial@gmail.com',
    createdByName: 'FET Academic Governance Board',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z'
  }
];
