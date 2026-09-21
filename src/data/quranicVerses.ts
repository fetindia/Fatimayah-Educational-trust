/**
 * @license
 * Official Verified Qur'anic Verses Registry for Credentials and Receipts
 * Fatimyah Educational Trust India
 * 
 * STRICT COMPLIANCE:
 * - All Arabic text in this registry is authentic, immutable, and verified from the Holy Qur'an.
 * - Arabic text must NEVER be paraphrased or rewritten.
 * - Arabic text must NOT be translated on ID cards or receipts.
 * - Super Admin can select only verified verses or explicitly labeled custom text with documented sources.
 */

export interface VerifiedQuranicVerse {
  id: string;
  arabicText: string;
  surahNameArabic: string;
  surahNameEnglish: string;
  surahNumber: number;
  ayahNumber: number;
  referenceString: string; // e.g., "Qur'an 2:257"
  arabicReferenceString: string; // e.g., "سورة البقرة: ٢٥٧"
  suitableRoles: string[]; // ['student', 'donor', 'member', 'volunteer', 'staff', 'teacher', 'administrator', 'donation_receipt']
  descriptionEnglish: string; // Internal context for Super Admin selection only; NOT printed on cards
}

export interface RoleQuranicVerseSetting {
  roleKey: string;
  arabicText: string;
  reference: string;
  arabicReference?: string;
  surahName?: string;
  englishTranslation?: string;
  enabled: boolean;
  isCustom?: boolean;
  customSource?: string;
}

export const VERIFIED_QURANIC_VERSES_CATALOG: VerifiedQuranicVerse[] = [
  // 1. Student / Knowledge (Primary default: Qur'an 2:257)
  {
    id: 'verse-student-2-257',
    arabicText: 'اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ',
    surahNameArabic: 'سورة البقرة',
    surahNameEnglish: 'Surah Al-Baqarah',
    surahNumber: 2,
    ayahNumber: 257,
    referenceString: "Qur'an 2:257",
    arabicReferenceString: 'سورة البقرة: ٢٥٧',
    suitableRoles: ['student'],
    descriptionEnglish: 'Allah is the ally of those who believe; He brings them out from darknesses into the light. (Core motto: Minar-ul-Zulmat Ila-Noor)'
  },
  {
    id: 'verse-student-96-1',
    arabicText: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    surahNameArabic: 'سورة العلق',
    surahNameEnglish: 'Surah Al-Alaq',
    surahNumber: 96,
    ayahNumber: 1,
    referenceString: "Qur'an 96:1",
    arabicReferenceString: 'سورة العلق: ١',
    suitableRoles: ['student'],
    descriptionEnglish: 'Recite in the name of your Lord who created.'
  },
  {
    id: 'verse-student-58-11',
    arabicText: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ',
    surahNameArabic: 'سورة المجادلة',
    surahNameEnglish: 'Surah Al-Mujadila',
    surahNumber: 58,
    ayahNumber: 11,
    referenceString: "Qur'an 58:11",
    arabicReferenceString: 'سورة المجادلة: ١١',
    suitableRoles: ['student'],
    descriptionEnglish: 'Allah will raise those who have believed among you and those who were given knowledge, by degrees.'
  },

  // 2. Donor / Philanthropy (Primary default: Qur'an 2:272)
  {
    id: 'verse-donor-2-272',
    arabicText: 'وَمَا تُنفِقُوا مِنْ خَيْرٍ فَلِأَنفُسِكُمْ',
    surahNameArabic: 'سورة البقرة',
    surahNameEnglish: 'Surah Al-Baqarah',
    surahNumber: 2,
    ayahNumber: 272,
    referenceString: "Qur'an 2:272",
    arabicReferenceString: 'سورة البقرة: ٢٧٢',
    suitableRoles: ['donor'],
    descriptionEnglish: 'And whatever good you [believers] spend is for yourselves.'
  },
  {
    id: 'verse-donor-3-92',
    arabicText: 'لَن تَنَالُوا الْبِرَّ حَتَّىٰ تُنفِقُوا مِمَّا تُحِبُّونَ',
    surahNameArabic: 'سورة آل عمران',
    surahNameEnglish: "Surah Ali 'Imran",
    surahNumber: 3,
    ayahNumber: 92,
    referenceString: "Qur'an 3:92",
    arabicReferenceString: 'سورة آل عمران: ٩٢',
    suitableRoles: ['donor'],
    descriptionEnglish: 'Never will you attain the good [reward] until you spend [in the way of Allah] from that which you love.'
  },
  {
    id: 'verse-donor-63-10',
    arabicText: 'وَأَنفِقُوا مِن مَّا رَزَقْنَاكُم',
    surahNameArabic: 'سورة المنافقون',
    surahNameEnglish: 'Surah Al-Munafiqun',
    surahNumber: 63,
    ayahNumber: 10,
    referenceString: "Qur'an 63:10",
    arabicReferenceString: 'سورة المنافقون: ١٠',
    suitableRoles: ['donor'],
    descriptionEnglish: 'And spend [in the way of Allah] from what We have provided you.'
  },

  // 3. Member / Community (Primary default: Qur'an 5:2)
  {
    id: 'verse-member-5-2',
    arabicText: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ',
    surahNameArabic: 'سورة المائدة',
    surahNameEnglish: "Surah Al-Ma'idah",
    surahNumber: 5,
    ayahNumber: 2,
    referenceString: "Qur'an 5:2",
    arabicReferenceString: 'سورة المائدة: ٢',
    suitableRoles: ['member', 'general_member', 'core_member'],
    descriptionEnglish: 'And cooperate in righteousness and piety.'
  },
  {
    id: 'verse-member-49-10',
    arabicText: 'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ',
    surahNameArabic: 'سورة الحجرات',
    surahNameEnglish: 'Surah Al-Hujurat',
    surahNumber: 49,
    ayahNumber: 10,
    referenceString: "Qur'an 49:10",
    arabicReferenceString: 'سورة الحجرات: ١٠',
    suitableRoles: ['member', 'general_member', 'core_member'],
    descriptionEnglish: 'The believers are but brothers.'
  },

  // 4. Volunteer / Service (Primary default: Qur'an 2:148)
  {
    id: 'verse-volunteer-2-148',
    arabicText: 'فَاسْتَبِقُوا الْخَيْرَاتِ',
    surahNameArabic: 'سورة البقرة',
    surahNameEnglish: 'Surah Al-Baqarah',
    surahNumber: 2,
    ayahNumber: 148,
    referenceString: "Qur'an 2:148",
    arabicReferenceString: 'سورة البقرة: ١٤٨',
    suitableRoles: ['volunteer'],
    descriptionEnglish: 'So race to [all that is] good.'
  },
  {
    id: 'verse-volunteer-2-158',
    arabicText: 'وَمَن تَطَوَّعَ خَيْرًا فَإِنَّ اللَّهَ شَاكِرٌ عَلِيمٌ',
    surahNameArabic: 'سورة البقرة',
    surahNameEnglish: 'Surah Al-Baqarah',
    surahNumber: 2,
    ayahNumber: 158,
    referenceString: "Qur'an 2:158",
    arabicReferenceString: 'سورة البقرة: ١٥٨',
    suitableRoles: ['volunteer'],
    descriptionEnglish: 'And whoever volunteers good - then indeed, Allah is appreciative and Knowing.'
  },

  // 5. Staff / Faculty (Primary default: Qur'an 16:90)
  {
    id: 'verse-staff-16-90',
    arabicText: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ',
    surahNameArabic: 'سورة النحل',
    surahNameEnglish: 'Surah An-Nahl',
    surahNumber: 16,
    ayahNumber: 90,
    referenceString: "Qur'an 16:90",
    arabicReferenceString: 'سورة النحل: ٩٠',
    suitableRoles: ['staff'],
    descriptionEnglish: 'Indeed, Allah orders justice and good conduct.'
  },
  {
    id: 'verse-staff-28-26',
    arabicText: 'إِنَّ خَيْرَ مَنِ اسْتَأْجَرْتَ الْقَوِيُّ الْأَمِينُ',
    surahNameArabic: 'سورة القصص',
    surahNameEnglish: 'Surah Al-Qasas',
    surahNumber: 28,
    ayahNumber: 26,
    referenceString: "Qur'an 28:26",
    arabicReferenceString: 'سورة القصص: ٢٦',
    suitableRoles: ['staff'],
    descriptionEnglish: 'Indeed, the best one you can hire is the strong and trustworthy.'
  },

  // 6. Teacher / Educator (Primary default: Qur'an 20:114)
  {
    id: 'verse-teacher-20-114',
    arabicText: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    surahNameArabic: 'سورة طه',
    surahNameEnglish: 'Surah Ta-Ha',
    surahNumber: 20,
    ayahNumber: 114,
    referenceString: "Qur'an 20:114",
    arabicReferenceString: 'سورة طه: ١١٤',
    suitableRoles: ['teacher'],
    descriptionEnglish: 'And say, "My Lord, increase me in knowledge."'
  },
  {
    id: 'verse-teacher-2-269',
    arabicText: 'يُؤْتِي الْحِكْمَةَ مَن يَشَاءُ ۚ وَمَن يُؤْتَ الْحِكْمَةَ فَقَدْ أُوتِيَ خَيْرًا كَثِيرًا',
    surahNameArabic: 'سورة البقرة',
    surahNameEnglish: 'Surah Al-Baqarah',
    surahNumber: 2,
    ayahNumber: 269,
    referenceString: "Qur'an 2:269",
    arabicReferenceString: 'سورة البقرة: ٢٦٩',
    suitableRoles: ['teacher'],
    descriptionEnglish: 'He gives wisdom to whom He wills, and whoever has been given wisdom has certainly been given much good.'
  },

  // 7. Administrator / Governance (Primary default: Qur'an 4:58)
  {
    id: 'verse-admin-4-58',
    arabicText: 'إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا',
    surahNameArabic: 'سورة النساء',
    surahNameEnglish: 'Surah An-Nisa',
    surahNumber: 4,
    ayahNumber: 58,
    referenceString: "Qur'an 4:58",
    arabicReferenceString: 'سورة النساء: ٥٨',
    suitableRoles: ['administrator', 'management'],
    descriptionEnglish: 'Indeed, Allah commands you to render trusts to whom they are due.'
  },
  {
    id: 'verse-admin-42-38',
    arabicText: 'وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ',
    surahNameArabic: 'سورة الشورى',
    surahNameEnglish: 'Surah Ash-Shura',
    surahNumber: 42,
    ayahNumber: 38,
    referenceString: "Qur'an 42:38",
    arabicReferenceString: 'سورة الشورى: ٣٨',
    suitableRoles: ['administrator', 'management'],
    descriptionEnglish: 'And whose affair is [determined by] consultation among themselves.'
  },

  // 8. Donation Receipt (Fixed standard: Qur'an 2:261)
  {
    id: 'verse-receipt-2-261',
    arabicText: 'مَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ',
    surahNameArabic: 'سورة البقرة',
    surahNameEnglish: 'Surah Al-Baqarah',
    surahNumber: 2,
    ayahNumber: 261,
    referenceString: "Qur'an 2:261",
    arabicReferenceString: 'سورة البقرة: ٢٦١',
    suitableRoles: ['donation_receipt'],
    descriptionEnglish: 'The example of those who spend their wealth in the way of Allah is like a seed [of grain] which grows seven spikes.'
  }
];

export const DEFAULT_ROLE_QURANIC_VERSES: Record<string, RoleQuranicVerseSetting> = {
  student: {
    roleKey: 'student',
    arabicText: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    reference: "Qur'an 20:114",
    arabicReference: 'سورة طه: ١١٤',
    surahName: 'Surah Ta-Ha',
    enabled: true
  },
  donor: {
    roleKey: 'donor',
    arabicText: 'وَمَا تُنفِقُوا مِنْ خَيْرٍ فَلِأَنفُسِكُمْ',
    reference: "Qur'an 2:272",
    arabicReference: 'سورة البقرة: ٢٧٢',
    surahName: 'Surah Al-Baqarah',
    enabled: true
  },
  member: {
    roleKey: 'member',
    arabicText: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ',
    reference: "Qur'an 5:2",
    arabicReference: 'سورة المائدة: ٢',
    surahName: "Surah Al-Ma'idah",
    enabled: true
  },
  general_member: {
    roleKey: 'general_member',
    arabicText: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ',
    reference: "Qur'an 5:2",
    arabicReference: 'سورة المائدة: ٢',
    surahName: "Surah Al-Ma'idah",
    enabled: true
  },
  core_member: {
    roleKey: 'core_member',
    arabicText: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ',
    reference: "Qur'an 5:2",
    arabicReference: 'سورة المائدة: ٢',
    surahName: "Surah Al-Ma'idah",
    enabled: true
  },
  volunteer: {
    roleKey: 'volunteer',
    arabicText: 'فَاسْتَبِقُوا الْخَيْرَاتِ',
    reference: "Qur'an 2:148",
    arabicReference: 'سورة البقرة: ١٤٨',
    surahName: 'Surah Al-Baqarah',
    enabled: true
  },
  staff: {
    roleKey: 'staff',
    arabicText: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ',
    reference: "Qur'an 16:90",
    arabicReference: 'سورة النحل: ٩٠',
    surahName: 'Surah An-Nahl',
    enabled: true
  },
  teacher: {
    roleKey: 'teacher',
    arabicText: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ',
    reference: "Qur'an 16:90",
    arabicReference: 'سورة النحل: ٩٠',
    surahName: 'Surah An-Nahl',
    enabled: true
  },
  administrator: {
    roleKey: 'administrator',
    arabicText: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ',
    reference: "Qur'an 16:90",
    arabicReference: 'سورة النحل: ٩٠',
    surahName: 'Surah An-Nahl',
    enabled: true
  },
  management: {
    roleKey: 'management',
    arabicText: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ',
    reference: "Qur'an 16:90",
    arabicReference: 'سورة النحل: ٩٠',
    surahName: 'Surah An-Nahl',
    enabled: true
  },
  donation_receipt: {
    roleKey: 'donation_receipt',
    arabicText: 'مَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ',
    reference: "Qur'an 2:261",
    arabicReference: 'سورة البقرة: ٢٦١',
    surahName: 'Surah Al-Baqarah',
    enabled: true
  }
};

/**
 * Resolves the active verse setting for a specific role or context.
 * Checks dynamic organization config first, then falls back to verified defaults.
 * Maps:
 * - Student/Education -> Qur'an 20:114
 * - Donor -> Qur'an 2:272
 * - Member (general/core) -> Qur'an 5:2
 * - Volunteer -> Qur'an 2:148
 * - Staff/Teacher/Administrator/Management -> Qur'an 16:90
 */
export function getRoleQuranicVerse(
  roleKey: string,
  dynamicConfig?: Record<string, RoleQuranicVerseSetting>
): RoleQuranicVerseSetting {
  const normalizedKey = (roleKey || 'member').toLowerCase().trim();
  
  if (dynamicConfig && dynamicConfig[normalizedKey]) {
    return dynamicConfig[normalizedKey];
  }

  // 1. Education / Student
  if (normalizedKey === 'student' || normalizedKey === 'education' || normalizedKey === 'scholar') {
    if (dynamicConfig?.student) return dynamicConfig.student;
    return DEFAULT_ROLE_QURANIC_VERSES.student;
  }

  // 2. Donor
  if (normalizedKey === 'donor' || normalizedKey === 'patron' || normalizedKey === 'sponsor') {
    if (dynamicConfig?.donor) return dynamicConfig.donor;
    return DEFAULT_ROLE_QURANIC_VERSES.donor;
  }

  // 3. Volunteer
  if (normalizedKey === 'volunteer' || normalizedKey === 'khidmat') {
    if (dynamicConfig?.volunteer) return dynamicConfig.volunteer;
    return DEFAULT_ROLE_QURANIC_VERSES.volunteer;
  }

  // 4. Staff / Teacher / Administrator / Management
  if (
    normalizedKey === 'staff' ||
    normalizedKey === 'teacher' ||
    normalizedKey === 'educator' ||
    normalizedKey === 'faculty' ||
    normalizedKey === 'administrator' ||
    normalizedKey === 'admin' ||
    normalizedKey === 'super_admin' ||
    normalizedKey === 'management'
  ) {
    if (dynamicConfig?.[normalizedKey]) return dynamicConfig[normalizedKey];
    if (dynamicConfig?.staff) return dynamicConfig.staff;
    if (dynamicConfig?.administrator) return dynamicConfig.administrator;
    return DEFAULT_ROLE_QURANIC_VERSES.staff;
  }

  // 5. Member / Core Member / General Member
  if (normalizedKey === 'general_member' || normalizedKey === 'core_member' || normalizedKey === 'member' || normalizedKey === 'trustee') {
    if (dynamicConfig?.[normalizedKey]) return dynamicConfig[normalizedKey];
    if (dynamicConfig?.member) return dynamicConfig.member;
    return DEFAULT_ROLE_QURANIC_VERSES[normalizedKey] || DEFAULT_ROLE_QURANIC_VERSES.member;
  }

  // Fallback to Member verse
  return DEFAULT_ROLE_QURANIC_VERSES[normalizedKey] || DEFAULT_ROLE_QURANIC_VERSES.member;
}
