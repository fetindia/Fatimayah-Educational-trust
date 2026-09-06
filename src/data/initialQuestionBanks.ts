/**
 * @license
 * Initial Multilingual Question Banks, Prescribed Chapters, and Question Pool
 * Fatimyah Educational Trust India (FET India)
 */

import { QuestionBank } from '../types';

export const INITIAL_QUESTION_BANKS: QuestionBank[] = [
  {
    id: 'qb-book-reading-mastery',
    code: 'QB-BOOK-001',
    title: 'Wings of Fire & Ethical Horizons Question Bank',
    subject: 'Literature, Moral Ethics & Comprehension',
    category: 'book_reading',
    description: 'Comprehensive chapter-wise question repository mapped to the prescribed book for National Book Reading Olympiad 2026.',
    primaryLanguage: 'en',
    supportedLanguages: ['en', 'ur', 'hi'],
    bookMastery: {
      bookTitle: 'Wings of Fire & Ethical Horizons: Biography and Moral Philosophy',
      author: 'Dr. A.P.J. Abdul Kalam & Dr. Arun Tiwari',
      publisher: 'Universities Press / FET Academic Edition',
      edition: 'National Educational Trust Edition 2026',
      chapters: [
        {
          chapterNumber: 1,
          chapterTitle: 'Orientation: Early Formative Years & Intellectual Foundations',
          topicSummary: 'Rameswaram upbringing, family values, perseverance, and early mentors.',
          recommendedPages: 'pp. 1-45'
        },
        {
          chapterNumber: 2,
          chapterTitle: 'Creation: Aeronautical Milestones & Indigenous Science',
          topicSummary: 'MIT Madras, Hovercraft development, INCOSPAR, and rocket launch fundamentals.',
          recommendedPages: 'pp. 46-95'
        },
        {
          chapterNumber: 3,
          chapterTitle: 'Propitiation: Satellite Launch Vehicles & Overcoming Setbacks',
          topicSummary: 'SLV-3 mission trajectory, handling technical failure, and institutional resilience.',
          recommendedPages: 'pp. 96-140'
        },
        {
          chapterNumber: 4,
          chapterTitle: 'Contemplation: Leadership, Vision 2020 & Moral Responsibility',
          topicSummary: 'Integrity in public administration, mentoring youth, and national development philosophy.',
          recommendedPages: 'pp. 141-180'
        }
      ]
    },
    questionsCount: 6,
    approvedQuestionsCount: 6,
    pendingReviewCount: 0,
    questions: [
      {
        id: 'qb-q-br-101',
        questionText: 'What foundational ethical principle did the author emphasize as essential for scientific progress and national service in Chapter 1?',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'مصنف نے باب اول میں سائنسی ترقی اور قومی خدمت کے لیے کس بنیادی اخلاقی اصول کو سب سے اہم قرار دیا ہے؟',
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
            questionText: 'अध्याय 1 में लेखक ने वैज्ञानिक प्रगति और राष्ट्रीय सेवा के लिए किस मूलभूत नैतिक सिद्धांत पर बल दिया है?',
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
        marks: 4,
        negativeMarks: 1,
        difficulty: 'medium',
        bookMastery: {
          bookTitle: 'Wings of Fire & Ethical Horizons',
          chapterNumber: 1,
          chapterTitle: 'Orientation: Early Formative Years',
          pageRange: 'pp. 18-22',
          topicTag: 'Scientific Ethics & Integrity'
        },
        explanation: 'The text highlights integrity and selfless dedication as the core virtues of impactful science.',
        status: 'approved',
        createdAt: '2026-07-10T10:00:00Z',
        updatedAt: '2026-07-10T10:00:00Z'
      },
      {
        id: 'qb-q-br-102',
        questionText: 'According to the prescribed text in Chapter 2, how should young scholars navigate career setbacks and technological failures?',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'باب دوم کے مطابق نوجوان محققین کو تعلیمی و تکنیکی ناکامیوں اور رکاوٹوں کا سامنا کیسے کرنا چاہیے؟',
            options: [
              'مشکل علمی اور تحقیقی سرگرمیوں کو فوری طور پر ترک کر کے',
              'ناکامی کو تشخیص و رہنمائی سمجھ کر اور منظم حکمت عملی سے ثابت قدم رہ کر',
              'سارا الزام صرف بیرونی دفتری مجبوریوں پر ڈال کر',
              'بنیادی سائنسی اصولوں کو نظر انداز کر کے'
            ],
            explanation: 'مصنف ناکامی کو سیکھنے کا موقع گردانتے ہیں اور پرعزم لچکداری کی تلقین کرتے ہیں۔',
            direction: 'rtl'
          },
          hi: {
            language: 'hi',
            questionText: 'अध्याय 2 के अनुसार, युवा विद्यार्थियों को तकनीकी असफलताओं और शैक्षणिक बाधाओं का सामना कैसे करना चाहिए?',
            options: [
              'कठिन शैक्षणिक प्रयासों को तुरंत छोड़कर',
              'असफलता को नैदानिक सीख मानकर और व्यवस्थित समस्या निवारण से धैर्य रखकर',
              'केवल बाहरी संगठनात्मक बाधाओं पर दोष मढ़कर',
              'मौलिक वैज्ञानिक सिद्धांतों की उपेक्षा करके'
            ],
            explanation: 'लेखक असफलता को सीखने की प्रतिक्रिया मानते हैं और सक्रिय लचीलापन अपनाने का आह्वान करते हैं।',
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
        marks: 4,
        negativeMarks: 1,
        difficulty: 'medium',
        bookMastery: {
          bookTitle: 'Wings of Fire & Ethical Horizons',
          chapterNumber: 2,
          chapterTitle: 'Creation: Aeronautical Milestones',
          pageRange: 'pp. 62-68',
          topicTag: 'Overcoming Adversity & Resilience'
        },
        explanation: 'The author defines failure as learning feedback and urges proactive resilience.',
        status: 'approved',
        createdAt: '2026-07-10T10:00:00Z',
        updatedAt: '2026-07-10T10:00:00Z'
      },
      {
        id: 'qb-q-br-103',
        questionText: 'In Chapter 3, what decisive leadership quality did Prof. Satish Dhawan demonstrate when the first SLV-3 experimental flight failed in August 1979?',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'باب سوم میں اگست 1979 کے دوران پہلے ایس ایل وی-3 مشن کی ناکامی پر پروفیسر ستیش دھون نے کون سی مثالی قیادت کا مظاہرہ کیا تھا؟',
            options: [
              'میڈیا کے سامنے خود ناکامی کی مکمل ذمہ داری قبول کی اور سائنسی ٹیم کو تنقید سے محفوظ رکھا',
              'پروجیکٹ لیڈر اور پوری تکنیکی ٹیم کو عوامی پریس کانفرنس میں قصوروار ٹھہرایا',
              'پروجیکٹ کو مستقل طور پر منسوخ کر دیا',
              'ناکامی کے اعداد و شمار کو چھپا دیا'
            ],
            direction: 'rtl'
          },
          hi: {
            language: 'hi',
            questionText: 'अध्याय 3 में, अगस्त 1979 में पहले SLV-3 मिशन की विफलता के समय प्रो. सतीश धवन ने किस अनुकरणीय नेतृत्व गुण का प्रदर्शन किया था?',
            options: [
              'प्रेस के समक्ष स्वयं असफलता की पूरी जिम्मेदारी ली और वैज्ञानिक टीम का मनोबल ऊंचा रखा',
              'प्रेस कॉन्फ्रेंस में परियोजना प्रमुख और वैज्ञानिकों पर दोष मढ़ दिया',
              'परियोजना को हमेशा के लिए बंद कर दिया',
              'विफलता के आंकड़ों को जनता से छुपा लिया'
            ],
            direction: 'ltr'
          }
        },
        questionType: 'mcq',
        options: [
          'He took personal responsibility at the press conference and shielded the engineering team',
          'He publicly blamed the project director and technical engineers',
          'He cancelled the national satellite launch program permanently',
          'He refused to face the media'
        ],
        correctOptionIndex: 0,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'hard',
        bookMastery: {
          bookTitle: 'Wings of Fire & Ethical Horizons',
          chapterNumber: 3,
          chapterTitle: 'Propitiation: SLV-3 Launch',
          pageRange: 'pp. 112-118',
          topicTag: 'Executive Leadership & Accountability'
        },
        explanation: 'Prof. Dhawan absorbed the blame when the mission failed and gave credit to the team when it succeeded.',
        status: 'approved',
        createdAt: '2026-07-10T10:00:00Z',
        updatedAt: '2026-07-10T10:00:00Z'
      },
      {
        id: 'qb-q-br-104',
        questionText: 'State whether the following statement is True or False: Dr. Kalam advocated that true technological self-reliance requires developing indigenous design capabilities rather than merely assembling imported subsystems.',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'بیان درست ہے یا غلط: ڈاکٹر کلام کا ماننا تھا کہ حقیقی تکنیکی خود انحصاری کے لیے صرف درآمدی پرزہ جات جوڑنے کی بجائے ملکی ڈیزائن و تخلیقی صلاحیتوں کا فروغ ضروری ہے۔',
            options: ['درست (True)', 'غلط (False)'],
            direction: 'rtl'
          },
          hi: {
            language: 'hi',
            questionText: 'सत्य या असत्य: डॉ. कलाम का मत था कि वास्तविक तकनीकी आत्मनिर्भरता के लिए केवल आयातित पुर्जों को जोड़ने के बजाय स्वदेशी डिजाइन क्षमताओं को विकसित करना अनिवार्य है।',
            options: ['सत्य (True)', 'असत्य (False)'],
            direction: 'ltr'
          }
        },
        questionType: 'true_false',
        options: ['True (درست / सत्य)', 'False (غلط / असत्य)'],
        correctOptionIndex: 0,
        marks: 3,
        negativeMarks: 0.5,
        difficulty: 'easy',
        bookMastery: {
          bookTitle: 'Wings of Fire & Ethical Horizons',
          chapterNumber: 4,
          chapterTitle: 'Contemplation: Vision 2020',
          pageRange: 'pp. 152-156',
          topicTag: 'Indigenous Innovation'
        },
        explanation: 'Dr. Kalam consistently championed indigenous innovation and end-to-end design self-reliance.',
        status: 'approved',
        createdAt: '2026-07-10T10:00:00Z',
        updatedAt: '2026-07-10T10:00:00Z'
      },
      {
        id: 'qb-q-br-105',
        questionText: 'Fill in the blank: "To succeed in your mission, you must have single-minded ______ to your goal."',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'خالی جگہ پر کریں: "اپنے مشن میں کامیابی کے لیے آپ کے پاس اپنے مقصد کے تئیں یکسوئی اور ______ ہونا ضروری ہے۔"',
            options: ['عزم / لگن (devotion)', 'تذبذب (indifference)', 'تساہل (hesitation)', 'تکبر (arrogance)'],
            direction: 'rtl'
          },
          hi: {
            language: 'hi',
            questionText: 'रिक्त स्थान भरें: "अपने लक्ष्य में सफल होने के लिए, आपके पास अपने ध्येय के प्रति एकाग्र ______ होनी चाहिए।"',
            options: ['निष्ठा / समर्पण (devotion)', 'उदासीनता (indifference)', 'द्विधा (hesitation)', 'अहंकार (arrogance)'],
            direction: 'ltr'
          }
        },
        questionType: 'fill_blank',
        options: ['devotion / dedication', 'indifference', 'hesitation', 'material greed'],
        correctOptionIndex: 0,
        marks: 3,
        negativeMarks: 0.5,
        difficulty: 'easy',
        bookMastery: {
          bookTitle: 'Wings of Fire & Ethical Horizons',
          chapterNumber: 4,
          chapterTitle: 'Contemplation: Leadership & Vision',
          pageRange: 'pp. 165',
          topicTag: 'Focus & Dedication'
        },
        explanation: 'The famous quote emphasizes single-minded devotion to one\'s purpose.',
        status: 'approved',
        createdAt: '2026-07-10T10:00:00Z',
        updatedAt: '2026-07-10T10:00:00Z'
      },
      {
        id: 'qb-q-br-106',
        questionText: 'Critical Analytical Essay: Drawing upon Chapter 4 of the prescribed text, discuss how modern educational institutions can instill ethical leadership and civic responsibility in young scholars to overcome contemporary societal inequities.',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'تنقیدی تجزیاتی مضمون (300 الفاظ): تجویز کردہ کتاب کے باب چہارم کی روشنی میں بحث کریں کہ جدید تعلیمی ادارے نوجوان طلبہ میں اخلاقی قیادت اور سماجی ذمہ داری کا شعور کیسے اجاگر کر سکتے ہیں تاکہ موجودہ معاشرتی ناانصافیوں کا خاتمہ ممکن ہو سکے؟',
            direction: 'rtl'
          },
          hi: {
            language: 'hi',
            questionText: 'आलोचनात्मक निबंध (300 शब्द): निर्धारित पुस्तक के अध्याय 4 के आधार पर चर्चा करें कि आधुनिक शिक्षण संस्थान समकालीन सामाजिक असमानताओं को दूर करने के लिए युवा विद्यार्थियों में नैतिक नेतृत्व और नागरिक उत्तरदायित्व की भावना कैसे विकसित कर सकते हैं?',
            direction: 'ltr'
          }
        },
        questionType: 'descriptive',
        marks: 20,
        difficulty: 'advanced',
        bookMastery: {
          bookTitle: 'Wings of Fire & Ethical Horizons',
          chapterNumber: 4,
          chapterTitle: 'Contemplation: Leadership, Vision & Society',
          pageRange: 'pp. 168-175',
          topicTag: 'Social Justice & Educational Philosophy'
        },
        explanation: 'Evaluated based on critical insight, thematic coherence with Kalam\'s philosophy, ethical depth, and clarity of argument.',
        status: 'approved',
        createdAt: '2026-07-10T10:00:00Z',
        updatedAt: '2026-07-10T10:00:00Z'
      }
    ],
    createdByUid: 'system_admin',
    createdByEmail: 'fetkofficial@gmail.com',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z'
  },
  {
    id: 'qb-stem-olympiad-pool',
    code: 'QB-STEM-001',
    title: 'National STEM & Science Olympiad Question Bank',
    subject: 'Physics, Pure Mathematics & Algorithmic Logic',
    category: 'stem_olympiad',
    description: 'Challenging analytical and conceptual questions for secondary and senior secondary talent olympiad candidates.',
    primaryLanguage: 'en',
    supportedLanguages: ['en', 'hi'],
    questionsCount: 5,
    approvedQuestionsCount: 5,
    pendingReviewCount: 0,
    questions: [
      {
        id: 'qb-q-stem-201',
        questionText: 'A particle moves along a straight line such that its displacement x at time t is given by x = 2t³ - 9t² + 12t + 5. At what time t (in seconds) does the acceleration of the particle become zero?',
        primaryLanguage: 'en',
        translations: {
          hi: {
            language: 'hi',
            questionText: 'एक कण एक सीधी रेखा में गतिमान है जहां समय t पर विस्थापन x = 2t³ - 9t² + 12t + 5 द्वारा दिया गया है। किस समय t (सेकंड में) पर कण का त्वरण शून्य हो जाएगा?',
            options: ['1.5 s', '2.0 s', '3.0 s', '0.5 s'],
            explanation: 'v = dx/dt = 6t² - 18t + 12; a = dv/dt = 12t - 18 = 0 => t = 18/12 = 1.5 s.',
            direction: 'ltr'
          }
        },
        questionType: 'mcq',
        options: ['1.5 seconds', '2.0 seconds', '3.0 seconds', '0.5 seconds'],
        correctOptionIndex: 0,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'medium',
        explanation: 'v = dx/dt = 6t² - 18t + 12; a = d²x/dt² = 12t - 18 = 0 => t = 18/12 = 1.5 s.',
        status: 'approved',
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-07-15T00:00:00Z'
      },
      {
        id: 'qb-q-stem-202',
        questionText: 'If the roots of the quadratic equation x² - 2kx + (k² + k - 5) = 0 are real and distinct, what is the range of real values of k?',
        primaryLanguage: 'en',
        translations: {
          hi: {
            language: 'hi',
            questionText: 'यदि द्विघात समीकरण x² - 2kx + (k² + k - 5) = 0 के मूल वास्तविक और भिन्न हैं, तो k का वास्तविक मान परिसर क्या होगा?',
            options: ['k < 5', 'k > 5', 'k ≤ 5', 'k > -5'],
            direction: 'ltr'
          }
        },
        questionType: 'mcq',
        options: ['k < 5', 'k > 5', 'k ≤ 5', 'k = 5'],
        correctOptionIndex: 0,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'hard',
        explanation: 'Discriminant D > 0 => (-2k)² - 4(1)(k² + k - 5) > 0 => 4k² - 4k² - 4k + 20 > 0 => -4k + 20 > 0 => 4k < 20 => k < 5.',
        status: 'approved',
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-07-15T00:00:00Z'
      },
      {
        id: 'qb-q-stem-203',
        questionText: 'In thermodynamics, which physical state variable remains constant during a reversible adiabatic expansion of an ideal gas?',
        primaryLanguage: 'en',
        translations: {
          hi: {
            language: 'hi',
            questionText: 'ऊष्मागतिकी में, एक आदर्श गैस के उत्क्रमणीय रुद्धोष्म (adiabatic) प्रसार के दौरान कौन सा भौतिक चर स्थिर रहता है?',
            options: ['एन्ट्रॉपी (Entropy S)', 'तापमान (Temperature T)', 'दाब (Pressure P)', 'आयतन (Volume V)'],
            direction: 'ltr'
          }
        },
        questionType: 'mcq',
        options: ['Entropy (S)', 'Temperature (T)', 'Pressure (P)', 'Internal Energy (U)'],
        correctOptionIndex: 0,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'medium',
        explanation: 'Reversible adiabatic process is isentropic (dQ = 0 => dS = dQ/T = 0, so S = constant).',
        status: 'approved',
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-07-15T00:00:00Z'
      },
      {
        id: 'qb-q-stem-204',
        questionText: 'What is the sum of the infinite geometric series: 1 + 1/3 + 1/9 + 1/27 + ... ?',
        primaryLanguage: 'en',
        translations: {
          hi: {
            language: 'hi',
            questionText: 'अनंत गुणोत्तर श्रेणी (infinite GP) 1 + 1/3 + 1/9 + 1/27 + ... का योग क्या है?',
            options: ['3/2 (1.5)', '4/3', '2', '9/4'],
            direction: 'ltr'
          }
        },
        questionType: 'mcq',
        options: ['3/2 (1.5)', '4/3', '2', '9/4'],
        correctOptionIndex: 0,
        marks: 3,
        negativeMarks: 0.5,
        difficulty: 'easy',
        explanation: 'S_inf = a / (1 - r) = 1 / (1 - 1/3) = 1 / (2/3) = 3/2 = 1.5.',
        status: 'approved',
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-07-15T00:00:00Z'
      },
      {
        id: 'qb-q-stem-205',
        questionText: 'Explain how Snell\'s Law and total internal reflection govern light propagation inside optical fiber cables used in modern high-speed broadband networks.',
        primaryLanguage: 'en',
        translations: {
          hi: {
            language: 'hi',
            questionText: 'विस्तार से समझाइए कि स्नेल का नियम और पूर्ण आंतरिक परावर्तन (Total Internal Reflection) आधुनिक हाई-स्पीड ब्रॉडबैंड नेटवर्क में उपयोग किए जाने वाले ऑप्टिकल फाइबर केबलों के भीतर प्रकाश संचरण को कैसे नियंत्रित करते हैं?',
            direction: 'ltr'
          }
        },
        questionType: 'descriptive',
        marks: 15,
        difficulty: 'advanced',
        explanation: 'Requires explaining core/cladding refractive index differential (n1 > n2), critical angle derivation θc = arcsin(n2/n1), and angle of incidence exceeding critical angle.',
        status: 'approved',
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-07-15T00:00:00Z'
      }
    ],
    createdByUid: 'system_admin',
    createdByEmail: 'fetkofficial@gmail.com',
    createdAt: '2026-06-15T00:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z'
  },
  {
    id: 'qb-islamic-studies-pool',
    code: 'QB-ISLAM-001',
    title: 'Islamic History, Ethics & Constitutional Values Question Bank',
    subject: 'Islamic History, Comparative Ethics & Civic Rights',
    category: 'islamic_studies',
    description: 'Multilingual question pool covering the Charter of Medina, universal ethics of justice, and the contributions of Indian Muslim scholars to the freedom struggle and national building.',
    primaryLanguage: 'en',
    supportedLanguages: ['en', 'ur', 'ar', 'hi'],
    questionsCount: 4,
    approvedQuestionsCount: 4,
    pendingReviewCount: 0,
    questions: [
      {
        id: 'qb-q-is-301',
        questionText: 'Which historical constitutional agreement drafted in 622 CE is celebrated globally by constitutional jurists as the earliest written charter establishing multi-faith civic equality and mutual community protection?',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: '622ء میں تیار کیا جانے والا کون سا تاریخی دستوری معاہدہ عالمی قانون دانوں کے نزدیک کثیر المذاہب مساوی شہریت اور باہمی تحفظ قائم کرنے والی اولین تحریری دستاویز ہے؟',
            options: [
              'میثاق مدینہ (Charter of Medina)',
              'صلح حدیبیہ (Treaty of Hudaybiyyah)',
              'عہد نامہ فاروقی (Pact of Umar)',
              'حجۃ الوداع کا خطبہ (Farewell Sermon)'
            ],
            explanation: 'میثاق مدینہ نے تمام قبائل اور مختلف مذاہب کے پیروکاروں کو ایک مشترکہ امت و سیاسی اکائی کے طور پر مساوی حقوق عطا کیے۔',
            direction: 'rtl'
          },
          ar: {
            language: 'ar',
            questionText: 'ما هي الوثيقة الدستورية التاريخية التي كُتبت عام 622م وتُعد أول دستور مكتوب يُرسخ المواطنة المتساوية لجميع المكونات الدينية؟',
            options: [
              'صحيفة المدينة (وثيقة المدينة)',
              'صلح الحديبية',
              'العهدة العمرية',
              'خطبة حجة الوداع'
            ],
            explanation: 'صحيفة المدينة رسخت مبدأ المواطنة المتكافئة والتعايش السلمي.',
            direction: 'rtl'
          },
          hi: {
            language: 'hi',
            questionText: '622 ईस्वी में तैयार किया गया कौन सा ऐतिहासिक संविधान बहु-धार्मिक नागरिक समानता और परस्पर सुरक्षा स्थापित करने वाला पहला लिखित दस्तावेज माना जाता है?',
            options: [
              'मदीना का चार्टर (मीसाक-ए-मदीना)',
              'हुदैबिया की संधि',
              'उमर का समझौता',
              'विदाई उपदेश'
            ],
            direction: 'ltr'
          }
        },
        questionType: 'mcq',
        options: [
          'Charter of Medina (Misaq-e-Madina)',
          'Treaty of Hudaybiyyah',
          'Pact of Umar',
          'Edict of Milan'
        ],
        correctOptionIndex: 0,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'medium',
        explanation: 'The Charter of Medina (622 CE) united distinct religious and tribal communities into a single civic body with shared rights and defensive duties.',
        status: 'approved',
        createdAt: '2026-05-15T00:00:00Z',
        updatedAt: '2026-08-30T10:00:00Z'
      },
      {
        id: 'qb-q-is-302',
        questionText: 'Which eminent Islamic philosopher and independent India\'s first Education Minister founded the Indian Institutes of Technology (IITs), Sahitya Akademi, and the University Grants Commission (UGC)?',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'آزاد ہندوستان کے پہلے وزیر تعلیم اور ممتاز عالم دین کون تھے جنہوں نے انڈین انسٹی ٹیوٹ آف ٹیکنالوجی (IITs)، ساہتیہ اکادمی اور یو جی سی کی بنیاد رکھی؟',
            options: [
              'مولانا ابو الکلام آزاد',
              'ڈاکٹر ذاکر حسین',
              'مولانا محمد علی جوہر',
              'حکیم اجمل خان'
            ],
            direction: 'rtl'
          },
          hi: {
            language: 'hi',
            questionText: 'स्वतंत्र भारत के पहले शिक्षा मंत्री और प्रख्यात विद्वान कौन थे जिन्होंने IIT, साहित्य अकादमी और UGC की नींव रखी?',
            options: [
              'मौलाना अबुल कलाम आज़ाद',
              'डॉ. ज़ाकिर हुसैन',
              'मौलाना मोहम्मद अली जौहर',
              'हकीम अजमल खान'
            ],
            direction: 'ltr'
          }
        },
        questionType: 'mcq',
        options: [
          'Maulana Abul Kalam Azad',
          'Dr. Zakir Husain',
          'Maulana Mohammad Ali Jauhar',
          'Hakim Ajmal Khan'
        ],
        correctOptionIndex: 0,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'easy',
        explanation: 'Maulana Abul Kalam Azad served as India\'s first Minister of Education from 1947 to 1958 and laid the foundation for modern higher education institutions.',
        status: 'approved',
        createdAt: '2026-05-15T00:00:00Z',
        updatedAt: '2026-08-30T10:00:00Z'
      },
      {
        id: 'qb-q-is-303',
        questionText: 'What universal ethical injunction regarding human dignity is explicitly revealed in the Quran, Surah Al-Isra (17:70)?',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'سورہ الاسراء (17:70) میں تمام انسانیت کی عزت و تکریم کے حوالے سے کیا واضح فرمان موجود ہے؟',
            options: [
              '"اور ہم نے یقیناً بنی آدم (تمام انسانوں) کو عزت اور فضیلت بخشی"',
              'عزت صرف ایک مخصوص نسل یا قبیلے کے لیے مخصوص ہے',
              'انسان کی قدر و قیمت صرف مادی دولت سے طے ہوتی ہے',
              'کرامت کا تعلق صرف جغرافیائی خطے سے ہے'
            ],
            direction: 'rtl'
          },
          ar: {
            language: 'ar',
            questionText: 'ما هو المبدأ الأخلاقي الإنساني العام الوارد في سورة الإسراء (آية 70)؟',
            options: [
              '"وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ"',
              'التكريم مقصور على قبيلة معينة',
              'القيمة الإنسانية تُقاس بالثروة المادية فقط',
              'الكرامة ترتبط بالموقع الجغرافي'
            ],
            direction: 'rtl'
          }
        },
        questionType: 'mcq',
        options: [
          '"And We have certainly honored the children of Adam (all humanity)"',
          'Honor is reserved exclusively for a single tribe or nation',
          'Material wealth is the sole determinant of human worth',
          'Dignity depends on geographic birthplace'
        ],
        correctOptionIndex: 0,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'easy',
        explanation: 'Surah Al-Isra 17:70 affirms that innate dignity is divinely conferred upon every human being universally.',
        status: 'approved',
        createdAt: '2026-05-15T00:00:00Z',
        updatedAt: '2026-08-30T10:00:00Z'
      },
      {
        id: 'qb-q-is-304',
        questionText: 'Critical Synthesis: Analyze the concept of "Adl" (Universal Justice) and "Ihsan" (Benevolence) in governance and how these ethical virtues align with the Directive Principles of State Policy in the Indian Constitution.',
        primaryLanguage: 'en',
        translations: {
          ur: {
            language: 'ur',
            questionText: 'تنقیدی مقالہ: حکمرانی میں "عدل" (انصاف) اور "احسان" (حسن سلوک و فلاح) کے تصور کا تجزیہ کریں اور واضح کریں کہ یہ اخلاقی اقدار بھارتی دستور میں درج ریاست کی حکمت عملی کے رہنما اصولوں (Directive Principles) سے کس طرح ہم آہنگ ہیں؟',
            direction: 'rtl'
          },
          ar: {
            language: 'ar',
            questionText: 'بحث تحليلي: ناقش مفهوم "العدل" و"الإحسان" في الحوكمة الرشيدة وكيف تلتقي هذه القيم الأخلاقية مع المبادئ التوجيهية للعدالة الاجتماعية في الدستور الهندي.',
            direction: 'rtl'
          }
        },
        questionType: 'descriptive',
        marks: 20,
        difficulty: 'advanced',
        explanation: 'Requires examining the Quranic mandate of unconditional justice (Surah An-Nisa 4:135) and correlating it with constitutional commitments to socioeconomic equity and civic brotherhood.',
        status: 'approved',
        createdAt: '2026-05-15T00:00:00Z',
        updatedAt: '2026-08-30T10:00:00Z'
      }
    ],
    createdByUid: 'system_admin',
    createdByEmail: 'fetkofficial@gmail.com',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z'
  }
];
