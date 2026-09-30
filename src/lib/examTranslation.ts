/**
 * @license
 * Multilingual Examination Paper Translation Engine
 * Fatimyah Educational Trust India (FET India)
 *
 * Supports multi-language examination delivery:
 * English, Urdu, Hindi, Bengali, Telugu, Arabic, Persian.
 * 
 * Rules:
 * 1. The original question paper stored in the database remains unchanged.
 * 2. Pre-authored translations in question.translations[lang] take precedence.
 * 3. Dynamic academic dictionary translation provides localization for exam prompts,
 *    instructions, standard options, and phrasing while preserving:
 *    - Numbers (e.g. 1, 2, 3, 100)
 *    - Mathematical expressions & formulas (e.g. E=mc², x^2 + y^2 = r^2)
 *    - Chemical symbols and technical notation
 *    - Acronyms, proper nouns, and code references
 * 4. Never overwrites the original stored question.
 */

import { ExamLanguage, ExamQuestion } from '../types';

export interface LanguageMeta {
  code: ExamLanguage;
  label: string;
  nativeLabel: string;
  isRtl: boolean;
  fontFamily: string;
}

export const SUPPORTED_EXAM_LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', isRtl: false, fontFamily: 'inherit' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', isRtl: false, fontFamily: "'Noto Sans Devanagari', sans-serif" },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', isRtl: true, fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif" },
  { code: 'ks', label: 'Kashmiri', nativeLabel: 'کٲشُر', isRtl: true, fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif" },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', isRtl: false, fontFamily: "'Noto Sans Bengali', sans-serif" },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', isRtl: false, fontFamily: "'Noto Sans Telugu', sans-serif" },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', isRtl: false, fontFamily: "'Noto Sans Tamil', sans-serif" },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', isRtl: false, fontFamily: "'Noto Sans Devanagari', sans-serif" },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', isRtl: false, fontFamily: "'Noto Sans Gujarati', sans-serif" },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', isRtl: false, fontFamily: "'Noto Sans Kannada', sans-serif" },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', isRtl: false, fontFamily: "'Noto Sans Malayalam', sans-serif" },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', isRtl: false, fontFamily: "'Noto Sans Gurmukhi', sans-serif" },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', isRtl: false, fontFamily: "'Noto Sans Oriya', sans-serif" },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া', isRtl: false, fontFamily: "'Noto Sans Bengali', sans-serif" },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', isRtl: true, fontFamily: "'Noto Naskh Arabic', 'Amiri', serif" },
  { code: 'fa', label: 'Persian', nativeLabel: 'فارسی', isRtl: true, fontFamily: "'Vazirmatn', 'Noto Naskh Arabic', serif" }
];

// Common Academic Translation Lexicon for on-the-fly rendering
const COMMON_PHRASES: Record<ExamLanguage, Record<string, string>> = {
  en: {},
  ur: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'بنیادی نصاب میں کس اہم نکتہ یا نظریے پر زور دیا گیا تھا؟',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'اس موضوع سے معاشرتی تبدیلی کے لیے حاصل ہونے والے اپنے ذاتی تاثرات اور تجزیے کا خلاصہ تحریر کریں۔',
    'Ethical service and rigorous analysis': 'اخلاقی خدمت اور جامع تجزیاتی مطالعہ',
    'Random guessing': 'غیر مصدقہ اندازہ لگانا',
    'Market isolation': 'معاشرتی و مارکیٹ سے الگ تھلگ رہنا',
    'Passive observance': 'غیر فعال مشاہدہ',
    'All of the above': 'مندرجہ بالا تمام',
    'None of the above': 'مندرجہ بالا میں سے کوئی نہیں',
    'True': 'صحیح (درست)',
    'False': 'غلط'
  },
  ks: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'بنیادی نصابس منز کٔتھ اَہَم کتھِ پؠٹھ زور دِنہٕ آو؟',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'یہِ موضوٗع کِتھ پٲٹھؠ سمٲجی بدلاو خٲطرٕ متاثر کَران چھُ، اَمیِک خلاصہٕ لیٖکھیو۔',
    'Ethical service and rigorous analysis': 'اخلٲقی خِدمَت تہٕ تفصیلی تجزِیہِ',
    'Random guessing': 'اندازٕ پؠٹھ جواب دِنیُک عمل',
    'Market isolation': 'سمٲجی اَلَگ تھَلَگ رۆزُن',
    'Passive observance': 'غیر فعال مشاہدٕ',
    'All of the above': 'ہیٚرِم تَمام',
    'None of the above': 'ہیٚرمؠن مَنٛز کانہہ نَہ',
    'True': 'پۆز (صحیح)',
    'False': 'اپُز (غلط)'
  },
  ta: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'பாடத்திட்டத்தில் எந்த முக்கியக் கருத்து வலியுறுத்தப்பட்டது?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'இந்தத் தலைப்பு சமுதாய மாற்றத்தை எவ்வாறு ஊக்குவிக்கிறது என்பது குறித்த உங்கள் பார்வையை எழுதுங்கள்.',
    'Ethical service and rigorous analysis': 'அறநெறிச் சேவை மற்றும் ஆழமான பகுப்பாய்வு',
    'Random guessing': 'தோராய கணிப்பு',
    'Market isolation': 'சமூக தனிமைப்படுத்தல்',
    'Passive observance': 'செயலற்ற கவனிப்பு',
    'All of the above': 'மேலே உள்ள அனைத்தும்',
    'None of the above': 'மேலே உள்ள எதுவும் இல்லை',
    'True': 'சரி (உண்மை)',
    'False': 'தவறு (பொய்)'
  },
  mr: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'मुख्य अभ्यासक्रमात कोणत्या महत्त्वाच्या सिद्धांतावर भर देण्यात आला होता?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'हा विषय सामाजिक परिवर्तनास कसा प्रेरित करतो यावर आपले विचार मांडा.',
    'Ethical service and rigorous analysis': 'नैतिक सेवा आणि सखोल विश्लेषणात्मक अभ्यास',
    'Random guessing': 'अंदाजे उत्तर देणे',
    'Market isolation': 'सामाजिक अलगाव',
    'Passive observance': 'निष्क्रिय निरीक्षण',
    'All of the above': 'वरील सर्व',
    'None of the above': 'वरीलपैकी काहीही नाही',
    'True': 'सत्य (बरोबर)',
    'False': 'असत्य (चूक)'
  },
  gu: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'મુખ્ય અભ્યાસક્રમમાં કયા મુખ્ય વિચાર પર ભાર મૂકવામાં આવ્યો હતો?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'આ વિષય સામાજિક પરિવર્તનને કેવી રીતે પ્રેરિત કરે છે તે અંગે તમારું વિશ્લેષણ લખો.',
    'Ethical service and rigorous analysis': 'નૈતિક સેવા અને ગહન વિશ્લેષણ',
    'Random guessing': 'અંદાજિત ઉત્તર',
    'Market isolation': 'સામાજિક અલગતા',
    'Passive observance': 'નિષ્ક્રિય અવલોકન',
    'All of the above': 'ઉપરોક્ત તમામ',
    'None of the above': 'ઉપરોક્તમાંથી કોઈ નહીં',
    'True': 'સાચું',
    'False': 'ખોટું'
  },
  kn: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'ಮುಖ್ಯ ಪಠ್ಯಕ್ರಮದಲ್ಲಿ ಯಾವ ಪ್ರಮುಖ ಪರಿಕಲ್ಪನೆಗೆ ಒತ್ತು ನೀಡಲಾಯಿತು?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'ಈ ವಿಷಯವು ಸಮಾಜದ ಪರಿವರ್ತನೆಗೆ ಹೇಗೆ ಪ್ರೇರಣೆ ನೀಡುತ್ತದೆ ಎಂಬುದರ ಕುರಿತು ನಿಮ್ಮ ಅನಿಸಿಕೆಯನ್ನು ಬರೆಯಿರಿ.',
    'Ethical service and rigorous analysis': 'ನೈತಿಕ ಸೇವೆ ಮತ್ತು ಆಳವಾದ ವಿಶ್ಲೇಷಣೆ',
    'Random guessing': 'ಊಹೆಯ ಉತ್ತರ',
    'Market isolation': 'ಸಾಮಾಜಿಕ ಪ್ರತ್ಯೇಕತೆ',
    'Passive observance': 'ನಿಷ್ಕ್ರಿಯ ವೀಕ್ಷಣೆ',
    'All of the above': 'ಮೇಲಿನ ಎಲ್ಲವೂ',
    'None of the above': 'ಮೇಲಿನ ಯಾವುದೂ ಅಲ್ಲ',
    'True': 'ಸರಿ',
    'False': 'ತಪ್ಪು'
  },
  ml: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'പ്രധാന പാഠ്യപദ്ധതിയിൽ ഏത് ആശയത്തിനാണ് ഊന്നൽ നൽകിയത്?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'ഈ വിഷയം സാമൂഹിക മാറ്റത്തെ എങ്ങനെ പ്രചോദിപ്പിക്കുന്നു എന്ന് വിശദീകരിക്കുക.',
    'Ethical service and rigorous analysis': 'ധാർമ്മിക സേവനവും സമഗ്ര വിശകലനവും',
    'Random guessing': 'സാധാരണ ഊഹം',
    'Market isolation': 'സാമൂഹിക ഒറ്റപ്പെടൽ',
    'Passive observance': 'നിഷ്ക്രിയ നിരീക്ഷണം',
    'All of the above': 'മുകളിൽ പറഞ്ഞവയെല്ലാം',
    'None of the above': 'ഇവയൊന്നുമല്ല',
    'True': 'ശരി',
    'False': 'തെറ്റ്'
  },
  pa: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'ਮੁੱਖ ਪਾਠਕ੍ਰਮ ਵਿੱਚ ਕਿਸ ਮੁੱਖ ਸਿਧਾਂਤ ਉੱਤੇ ਜ਼ੋਰ ਦਿੱਤਾ ਗਿਆ ਸੀ?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'ਇਹ ਵਿਸ਼ਾ ਸਮਾਜਿਕ ਤਬਦੀਲੀ ਨੂੰ ਕਿਵੇਂ ਪ੍ਰੇਰਿਤ ਕਰਦਾ ਹੈ, ਇਸ ਬਾਰੇ ਆਪਣਾ ਵਿਸ਼ਲੇਸ਼ਣ ਲਿਖੋ।',
    'Ethical service and rigorous analysis': 'ਨੈਤਿਕ ਸੇਵਾ ਅਤੇ ਡੂੰਘਾ ਵਿਸ਼ਲੇਸ਼ਣ',
    'Random guessing': 'ਅੰਦਾਜ਼ੇ ਨਾਲ ਉੱਤਰ ਦੇਣਾ',
    'Market isolation': 'ਸਮਾਜਿਕ ਅਲੱਗਤਾ',
    'Passive observance': 'ਨਿਸ਼ਕਿਰਿਆ ਨਿਰੀਖਣ',
    'All of the above': 'ਉਪਰੋਕਤ ਸਾਰੇ',
    'None of the above': 'ਉਪਰੋਕਤ ਵਿੱਚੋਂ ਕੋਈ ਨਹੀਂ',
    'True': 'ਸੱਚ (ਸਹੀ)',
    'False': 'ਝੂਠ (ਗ਼ਲਤ)'
  },
  or: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'ମୁଖ୍ୟ ପାଠ୍ୟକ୍ରମରେ କେଉଁ ମୁଖ୍ୟ ଧାରଣା ଉପରେ ଗୁରୁତ୍ୱ ଦିଆଯାଇଥିଲା?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'ଏହି ବିଷୟ କିପରି ସାମାଜିକ ପରିବର୍ତ୍ତନକୁ ଉତ୍ସାହିତ କରେ ତାହା ଉପରେ ଆପଣଙ୍କ ମତାମତ ଲେଖନ୍ତୁ।',
    'Ethical service and rigorous analysis': 'ନୈତିକ ସେବା ଏବଂ ଗଭୀର ବିଶ୍ଳେଷଣ',
    'Random guessing': 'ଆନୁମାନିକ ଉତ୍ତର',
    'Market isolation': 'ସାମାଜିକ ବିଚ୍ଛିନ୍ନତା',
    'Passive observance': 'ନିଷ୍କ୍ରିୟ ପର୍ଯ୍ୟବେକ୍ଷଣ',
    'All of the above': 'ଉପରୋକ୍ତ ସମସ୍ତ',
    'None of the above': 'ଉପରୋକ୍ତ ମଧ୍ୟରୁ କୌଣସିଟି ନୁହେଁ',
    'True': 'ସତ୍ୟ',
    'False': 'ମିଥ୍ୟା'
  },
  as: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'মুখ্য পাঠ্যক্ৰমত কোনটো মূল ধাৰণাৰ ওপৰত গুৰুত্ব দিয়া হৈছিল?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'এই বিষয়টোৱে সমাজ পৰিৱৰ্তনত কেনেকৈ প্ৰেৰণা যোগায়, সেই সম্পৰ্কে আপোনাৰ মতামত লিখক।',
    'Ethical service and rigorous analysis': 'নৈতিক সেৱা আৰু গভীৰ বিশ্লেষণ',
    'Random guessing': 'আনুমানিক উত্তৰ',
    'Market isolation': 'সামাজিক বিচ্ছিন্নতা',
    'Passive observance': 'নিষ্ক্ৰিয় পৰ্যবেক্ষণ',
    'All of the above': 'ওপৰৰ আটাইকেইটা',
    'None of the above': 'ওপৰৰ এটাও নহয়',
    'True': 'সঁচা',
    'False': 'মিছা'
  },
  hi: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'मुख्य पाठ्यक्रम में किस प्रमुख दृष्टिकोण या निष्कर्ष पर बल दिया गया था?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'यह विषय सामुदायिक उत्थान को कैसे प्रेरित करता है, इस पर अपना व्यक्तिगत विचार और विश्लेषण प्रस्तुत करें।',
    'Ethical service and rigorous analysis': 'नैतिक सेवा और गहन विश्लेषणात्मक अध्ययन',
    'Random guessing': 'यादृच्छिक अनुमान लगाना',
    'Market isolation': 'बाजार अलगाव',
    'Passive observance': 'निष्क्रिय अवलोकन',
    'All of the above': 'उपरोक्त सभी',
    'None of the above': 'उपरोक्त में से कोई नहीं',
    'True': 'सत्य (सही)',
    'False': 'असत्य (गलत)'
  },
  bn: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'মূল পাঠ্যক্রমে কোন মূল তত্ত্ব বা ধারণার ওপর জোর দেওয়া হয়েছিল?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'এই বিষয়টি কীভাবে সামাজিক পরিবর্তনের অনুপ্রেরণা জোগায়, সে সম্পর্কে আপনার ব্যক্তিগত মতামত ও বিশ্লেষণ লিখুন।',
    'Ethical service and rigorous analysis': 'নৈতিক মানবসেবা এবং গভীর বিশ্লেষণমূলক অধ্যয়ন',
    'Random guessing': 'অনুমান নির্ভর উত্তর',
    'Market isolation': 'সামাজিক বিচ্ছিন্নতা',
    'Passive observance': 'নিষ্ক্রিয় পর্যবেক্ষণ',
    'All of the above': 'উপরের সবগুলো',
    'None of the above': 'উপরের কোনটিই নয়',
    'True': 'সত্য',
    'False': 'মিথ্যা'
  },
  te: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'ప్రధాన పాఠ్యప్రణాళికలో ఏ ముఖ్యమైన ఆలోచన లేదా సిద్ధాంతంపై ప్రాధాన్యత ఇవ్వబడింది?',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'ఈ అంశం సామాజిక పరివర్తనను ఎలా ప్రేరేపిస్తుందో మీ వ్యక్తిగత ఆలోచన మరియు విశ్లేషణను వివరించండి.',
    'Ethical service and rigorous analysis': 'నైతిక సేవ మరియు సమగ్ర విశ్లేషణ',
    'Random guessing': 'యాదృచ్ఛిక ఊహ',
    'Market isolation': 'మార్కెట్ వేరుపాటు',
    'Passive observance': 'నిష్క్రియాత్మక పరిశీలన',
    'All of the above': 'పైవన్నీ',
    'None of the above': 'పైవేవీ కావు',
    'True': 'నిజం',
    'False': 'తప్పు'
  },
  ar: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'ما هي الرؤية الأساسية أو الأطروحة التي تم التأكيد عليها في المنهج التعليمي الرئيسي؟',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'لخّص تأملك الشخصي وتحليلك حول كيفية إلهام هذا الموضوع للنهضة والتحول المجتمعي.',
    'Ethical service and rigorous analysis': 'الخدمة الأخلاقية والتحليل المعرفي الدقيق',
    'Random guessing': 'التخمين العشوائي',
    'Market isolation': 'العزلة عن المجتمع والسوق',
    'Passive observance': 'المراقبة السلبية',
    'All of the above': 'جميع ما سبق',
    'None of the above': 'لا شيء مما سبق',
    'True': 'صحيح',
    'False': 'خطأ'
  },
  fa: {
    'Which key insight or thesis was emphasized in the core curriculum?': 'چه بینش یا نظریه کلیدی در برنامه درسی اصلی مورد تاکید قرار گرفته بود؟',
    'Synthesize your personal reflection on how this topic inspires community transformation.': 'دیدگاه و تحلیل شخصی خود را در مورد چگونگی الهام‌بخشی این موضوع برای تحول اجتماعی بنویسید.',
    'Ethical service and rigorous analysis': 'خدمت اخلاق‌مدارانه و تحلیل موشکافانه',
    'Random guessing': 'حدس تصادفی',
    'Market isolation': 'انزوای اجتماعی و بازار',
    'Passive observance': 'مشاهده غیرفعال',
    'All of the above': 'همه موارد فوق',
    'None of the above': 'هیچکدام از موارد فوق',
    'True': 'درست',
    'False': 'نادرست'
  }
};

export interface LocalizedQuestionResult {
  text: string;
  options: string[];
  isRtl: boolean;
  fontFamily: string;
  languageMeta: LanguageMeta;
  isTranslated: boolean;
}

/**
 * Returns localized text and options for candidate display without mutating the question.
 */
export function getLocalizedQuestion(
  question: ExamQuestion,
  language: ExamLanguage
): LocalizedQuestionResult {
  const langMeta = SUPPORTED_EXAM_LANGUAGES.find(l => l.code === language) || SUPPORTED_EXAM_LANGUAGES[0];

  // 1. If English (default), return original pristine question
  if (language === 'en') {
    return {
      text: question.questionText,
      options: question.options || [],
      isRtl: false,
      fontFamily: langMeta.fontFamily,
      languageMeta: langMeta,
      isTranslated: false
    };
  }

  // 2. If pre-authored translation exists in question.translations
  if (question.translations && question.translations[language]) {
    const t = question.translations[language]!;
    return {
      text: t.questionText || question.questionText,
      options: t.options && t.options.length > 0 ? t.options : (question.options || []),
      isRtl: langMeta.isRtl,
      fontFamily: langMeta.fontFamily,
      languageMeta: langMeta,
      isTranslated: true
    };
  }

  // 3. Check common phrases dictionary for accurate static translation
  const dict = COMMON_PHRASES[language] || {};
  const translatedText = dict[question.questionText] || question.questionText;
  const translatedOptions = (question.options || []).map(opt => dict[opt] || opt);

  const hasTranslation = translatedText !== question.questionText || 
    translatedOptions.some((opt, idx) => opt !== (question.options?.[idx]));

  return {
    text: translatedText,
    options: translatedOptions,
    isRtl: langMeta.isRtl,
    fontFamily: langMeta.fontFamily,
    languageMeta: langMeta,
    isTranslated: hasTranslation
  };
}

/**
 * Formats exam instructions localized into selected language
 */
export function getLocalizedInstructions(
  instructions: string[] | undefined,
  language: ExamLanguage,
  durationMinutes: number
): { text: string; isRtl: boolean }[] {
  const langMeta = SUPPORTED_EXAM_LANGUAGES.find(l => l.code === language) || SUPPORTED_EXAM_LANGUAGES[0];

  const defaultList = instructions && instructions.length > 0
    ? instructions
    : [
        `You have ${durationMinutes} minutes to complete all sections of this paper.`,
        `All questions must be answered independently under proctored integrity guidelines.`,
        `Switching browser tabs or exiting fullscreen mode is strictly monitored and flagged.`,
        `Once the examination timer expires, your responses are automatically submitted.`
      ];

  if (language === 'en') {
    return defaultList.map(text => ({ text, isRtl: false }));
  }

  // Localized template phrases
  const localizedTemplates: Record<ExamLanguage, string[]> = {
    en: defaultList,
    ur: [
      `اس پرچہ کے تمام حصوں کو مکمل کرنے کے لیے آپ کے پاس ${durationMinutes} منٹ کا وقت ہے۔`,
      `امتحانی ہدایات اور امانتداری کے اصولوں کے تحت تمام سوالات کا جواب آزادانہ طور پر دیں۔`,
      `براؤزر ٹیب کو تبدیل کرنا یا فل سکرین سے باہر جانا ممنوع ہے اور سسٹم اس کی نگرانی کر رہا ہے۔`,
      `وقت کی میعاد ختم ہونے پر آپ کے جوابات خود بخود حتمی طور پر جمع ہو جائیں گے۔`
    ],
    ks: [
      `امتحٲنی پرچہ مکمَل کَرنہٕ خٲطرٕ چھُ تُہندِس نِش ${durationMinutes} مۆنَٹ وَقٕتھ۔`,
      `امتحٲنی اَمانتدٲری ہٕندِس قونوٗنس تَل کٔرِو تَمام سَوالَن ہٕندؠ جَواب پانے۔`,
      `براؤزر ٹیب بدلاوُن یا سکرین بَند کَرُن مَمنوٗع چھُ تہٕ سِسٹَم چھُ اَمیِچ نگرانی کَران۔`,
      `وَقٕتھ خَتَم گژھنہٕ سٟتؠ یِن تُہندِ جَواب خود بخود سَبمِٹ کَرنہٕ۔`
    ],
    hi: [
      `इस प्रश्न पत्र के सभी खंडों को पूरा करने के लिए आपके पास ${durationMinutes} मिनट का समय है।`,
      `परीक्षा नियमों और सत्यनिष्ठा दिशा-निर्देशों के तहत सभी प्रश्नों का उत्तर स्वयं दें।`,
      `ब्राउज़र टैब बदलना या फुलस्क्रीन से बाहर जाना प्रतिबंधित है और सिस्टम द्वारा मॉनिटर किया जा रहा है।`,
      `समय सीमा समाप्त होते ही आपके उत्तर स्वतः सुरक्षित रूप से जमा हो जाएंगे।`
    ],
    ta: [
      `இந்தத் தேர்வுத் தாளை முடிக்க உங்களுக்கு ${durationMinutes} நிமிடங்கள் உள்ளன.`,
      `தேர்வு ஒருமைப்பாடு வழிகாட்டுதல்களின்படி அனைத்து கேள்விகளுக்கும் சுயமாக பதிலளிக்கவும்.`,
      `உலாவி தாவலை மாற்றுவது அல்லது முழுத்திரையிலிருந்து வெளியேறுவது கண்காணிக்கப்படுகிறது.`,
      `நேரம் முடிந்ததும் உங்கள் பதில்கள் தானாகவே சமர்ப்பிக்கப்படும்.`
    ],
    mr: [
      `या प्रश्नपत्रिकेतील सर्व विभाग पूर्ण करण्यासाठी आपल्याकडे ${durationMinutes} मिनिटे आहेत.`,
      `परीक्षा नियमांनुसार सर्व प्रश्नांची उत्तरे स्वतः द्या.`,
      `ब्राउझर टॅब बदलणे किंवा फुलस्क्रीनमधून बाहेर पडणे प्रतिबंधित आहे.`,
      `वेळ संपताच आपली उत्तरे आपोआप सबमिट केली जातील.`
    ],
    gu: [
      `આ પ્રશ્નપત્ર પૂર્ણ કરવા માટે તમારી પાસે ${durationMinutes} મિનિટ છે.`,
      `પરીક્ષા નિયમો અનુસાર તમામ પ્રશ્નોના જવાબો આપમેળે આપો.`,
      `બ્રાઉઝર ટેબ બદલવું અથવા પૂર્ણસ્ક્રીનમાંથી બહાર નીકળવું પ્રતિબંધિત છે.`,
      `સમય પૂરો થતાં જ તમારા જવાબો આપમેળે સબમિટ થઈ જશે.`
    ],
    kn: [
      `ಈ ಪರೀಕ್ಷಾ ಪತ್ರಿಕೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ನಿಮಗೆ ${durationMinutes} ನಿಮಿಷಗಳ ಕಾಲಾವಕಾಶವಿದೆ.`,
      `ಪರೀಕ್ಷಾ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.`,
      `ಬ್ರೌಸರ್ ಟ್ಯಾಬ್ ಬದಲಾಯಿಸುವುದು ಅಥವಾ ಪೂರ್ಣಪರದೆಯಿಂದ ನಿರ್ಗಮಿಸುವುದನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತದೆ.`,
      `ಸಮಯ ಮುಗಿದ ತಕ್ಷಣ ನಿಮ್ಮ ಉತ್ತರಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಕೆಯಾಗುತ್ತವೆ.`
    ],
    ml: [
      `ഈ പരീക്ഷാ പേപ്പർ പൂർത്തിയാക്കാൻ നിങ്ങൾക്ക് ${durationMinutes} മിനിറ്റുകൾ ഉണ്ട്.`,
      `പരീക്ഷാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ പാലിച്ച് എല്ലാ ചോദ്യങ്ങൾക്കും ഉത്തരം നൽകുക.`,
      `ബ്രൗസർ ടാബ് മാറ്റുന്നതും പൂർണ്ണസ്‌ക്രീൻ വിടുന്നതും നിരീക്ഷിക്കപ്പെടുന്നു.`,
      `സമയം കഴിയുമ്പോൾ ഉത്തരങ്ങൾ സ്വയമേവ സമർപ്പിക്കപ്പെടും.`
    ],
    pa: [
      `ਇਸ ਪ੍ਰੀਖਿਆ ਪੱਤਰ ਨੂੰ ਪੂਰਾ ਕਰਨ ਲਈ ਤੁਹਾਡੇ ਕੋਲ ${durationMinutes} ਮਿੰਟ ਹਨ।`,
      `ਪ੍ਰੀਖਿਆ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਸਾਰੇ ਪ੍ਰਸ਼ਨਾਂ ਦੇ ਉੱਤਰ ਖ਼ੁਦ ਦਿਓ।`,
      `ਬ੍ਰਾਊਜ਼ਰ ਟੈਬ ਬਦਲਣਾ ਜਾਂ ਫੁੱਲਸਕ੍ਰੀਨ ਤੋਂ ਬਾਹਰ ਜਾਣਾ ਮਨਾਹੀ ਹੈ।`,
      `ਸਮਾਂ ਸਮਾਪਤ ਹੁੰਦੇ ਹੀ ਤੁਹਾਡੇ ਉੱਤਰ ਆਪਣੇ ਆਪ ਜਮ੍ਹਾਂ ਹੋ ਜਾਣਗੇ।`
    ],
    or: [
      `ଏହି ପ୍ରଶ୍ନପତ୍ର ସମ୍ପୂର୍ଣ୍ଣ କରିବାକୁ ଆପଣଙ୍କ ପାଖରେ ${durationMinutes} ମିନିଟ୍ ସମୟ ଅଛି।`,
      `ପରୀକ୍ଷା ନିୟମାବଳୀ ଅନୁଯାୟୀ ସମସ୍ତ ପ୍ରଶ୍ନର ଉତ୍ତର ନିଜେ ଦିଅନ୍ତୁ।`,
      `ବ୍ରାଉଜର ଟ୍ୟାବ୍ ବଦଳାଇବା କିମ୍ବା ଫୁଲ୍ ସ୍କ୍ରିନରୁ ବାହାରିବା ନିଷିଦ୍ଧ।`,
      `ସମୟ ସମାପ୍ତ ହେବା ମାତ୍ରେ ଆପଣଙ୍କ ଉତ୍ତର ଆପେ ଆପେ ଦାଖଲ ହୋଇଯିବ।`
    ],
    as: [
      `এই পৰীক্ষাৰ প্ৰশ্নকাকত সম্পূৰ্ণ কৰিবলৈ আপোনাৰ হাতত ${durationMinutes} মিনিট সময় আছে।`,
      `পৰীক্ষাৰ নিয়ম অনুসৰি সকলো প্ৰশ্নৰ উত্তৰ নিজাববীয়াকৈ দিয়ক।`,
      `ব্ৰাউজাৰ টেব সলনি কৰা বা ফুলস্ক্ৰীণৰ পৰা ওলাই যোৱা নিষিদ্ধ।`,
      `সময় শেষ হোৱাৰ লগে লগে আপোনাৰ উত্তৰসমূহ স্বয়ংক্ৰিয়ভাৱে জমা হৈ যাব।`
    ],
    bn: [
      `এই পরীক্ষার সমস্ত বিভাগ সম্পন্ন করার জন্য আপনার কাছে ${durationMinutes} মিনিট সময় রয়েছে।`,
      `পরীক্ষার সততা নির্দেশিকা অনুসারে সমস্ত প্রশ্নের উত্তর স্বতন্ত্রভাবে প্রদান করুন।`,
      `ব্রাউজার ট্যাব পরিবর্তন করা বা ফুলস্ক্রিন থেকে বের হওয়া কঠোরভাবে পর্যবেক্ষণ করা হচ্ছে।`,
      `নির্ধারিত সময় শেষ হওয়ার সাথে সাথে আপনার উত্তরপত্র স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।`
    ],
    te: [
      `ఈ పరీక్షలోని అన్ని విభాగాలను పూర్తి చేయడానికి మీకు ${durationMinutes} నిమిషాల సమయం ఉంది.`,
      `పరీక్ష నియమావళి ప్రకారం అన్ని ప్రశ్నలకు స్వయంగా సమాధానం ఇవ్వండి.`,
      `బ్రౌజర్ ట్యాబ్ మార్చడం లేదా ఫుల్‌స్క్రీన్ నుండి నిష్క్రమించడం నిషేధించబడింది.`,
      `సమయం ముగిసిన వెంటనే మీ సమాధానాలు స్వయంచాలకంగా సమర్పించబడతాయి.`
    ],
    ar: [
      `لديك ${durationMinutes} دقيقة لإكمال جميع أقسام ورقة الامتحان هذه.`,
      `يجب الإجابة على جميع الأسئلة باستقلالية تامة وفقًا لمعايير النزاهة الأكاديمية.`,
      `التبديل بين علامات تبويب المتصفح أو الخروج من وضع ملء الشاشة مراقب بدقة.`,
      `بمجرد انتهاء وقت الامتحان، سيتم إرسال إجاباتك تلقائيًا وبشكل نهائي.`
    ],
    fa: [
      `شما ${durationMinutes} دقیقه برای تکمیل تمام بخش‌های این آزمون فرصت دارید.`,
      `پاسخ به تمامی سوالات باید به صورت مستقل و طبق موازین انضباطی آزمون باشد.`,
      `تغییر زبانه مرورگر یا خروج از حالت تمام صفحه تحت نظارت سیستم است.`,
      `به محض اتمام زمان، پاسخ‌های شما به صورت خودکار ثبت و ارسال خواهند شد.`
    ]
  };

  const selectedList = localizedTemplates[language] || defaultList;
  return selectedList.map(text => ({ text, isRtl: langMeta.isRtl }));
}
