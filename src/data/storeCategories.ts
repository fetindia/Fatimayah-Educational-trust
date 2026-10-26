/**
 * @license
 * Store Categories & Subcategories Master Definitions (Task 3: Product Detail & Public Store Experience)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Supports first-class core categories:
 * - Books (Mandatory core category)
 * - Islamic Wear (Modest attire, prayer garments & accessories)
 * - Perfumes & Attars (Pure oudh, alcohol-free fragrances & sets)
 * As well as additional categories:
 * - Educational Materials
 * - FET Publications
 * - Merchandise
 * - Digital Products
 * Extensible by Super Admin via Firestore.
 */

export interface StoreCategorySeed {
  name: string;
  slug: string;
  desc: string;
  isCore: boolean;
  subcategories: string[];
}

export const CORE_STORE_CATEGORIES: StoreCategorySeed[] = [
  {
    name: 'Books',
    slug: 'books',
    desc: 'Official prescribed syllabus textbooks, competition study texts, children\'s moral stories, and theological publications.',
    isCore: true,
    subcategories: [
      'Islamic Books',
      'Educational Books',
      'Children\'s Books',
      'FET Publications',
      'Other Books'
    ]
  },
  {
    name: 'Islamic Wear',
    slug: 'islamic_wear',
    desc: 'Ethical modest clothing, daily abayas, kurtas, thobes, prayer garments, and dignified modest accessories.',
    isCore: true,
    subcategories: [
      'Men\'s Islamic Wear',
      'Women\'s Islamic Wear',
      'Children\'s Islamic Wear',
      'Muslim Wear / Modest Wear',
      'Prayer Wear',
      'Islamic Clothing Accessories'
    ]
  },
  {
    name: 'Perfumes',
    slug: 'perfumes',
    desc: 'Non-alcoholic traditional attars, pure concentrated oudh fragrances, and curated gift sets.',
    isCore: true,
    subcategories: [
      'Alcohol-Free Perfumes',
      'Attar / Concentrated Perfumes',
      'Fragrance Sets',
      'Other permitted fragrance products'
    ]
  },
  {
    name: 'Educational Materials',
    slug: 'materials',
    desc: 'Classroom study kits, laboratory stationery, academic aids, and school supplies.',
    isCore: false,
    subcategories: [
      'Study Kits',
      'Stationery & Notebooks',
      'Scientific Teaching Aids',
      'Classroom Charts & Models'
    ]
  },
  {
    name: 'FET Publications',
    slug: 'publications',
    desc: 'Official trust annual research reports, academic journals, and symposium literature.',
    isCore: false,
    subcategories: [
      'Research Papers',
      'Theological Symposiums',
      'Annual Reports & Audits',
      'Curriculum Frameworks'
    ]
  },
  {
    name: 'Digital Products',
    slug: 'digital',
    desc: 'Downloadable syllabus e-books, competition audio guides, and digital study resources.',
    isCore: false,
    subcategories: [
      'E-Books & PDFs',
      'Audio & Video Lectures',
      'Digital Study Guides',
      'Competition Mock Tests'
    ]
  },
  {
    name: 'Merchandise',
    slug: 'merchandise',
    desc: 'Trust commemorative emblems, institutional insignia, modest uniforms, and badges.',
    isCore: false,
    subcategories: [
      'Trust Badges & Pins',
      'Commemorative Plaques',
      'Institution Uniforms',
      'Charity Gift Items'
    ]
  }
];

/**
 * Generates a clean, url-safe, deterministic product slug.
 * Example: "Mastering Islamic Ethics (Vol. 1)" -> "mastering-islamic-ethics-vol-1"
 */
export function generateProductSlug(name: string, fallbackId?: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (base.length > 2) {
    return base;
  }

  const cleanFallback = fallbackId ? fallbackId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase() : Math.random().toString(36).slice(2, 8);
  return `item-${cleanFallback}`;
}

export interface StoreDepartmentInfo {
  id: string;
  slug: string;
  categoryKey: string;
  title: string;
  tagline: string;
  shortDescription: string;
  educationalWelfareNote: string;
  iconName: string;
  badge: string;
  isActive: boolean;
  subcategories: string[];
}

export const STORE_DEPARTMENTS: StoreDepartmentInfo[] = [
  {
    id: 'islamic-wear',
    slug: 'islamic-wear',
    categoryKey: 'islamic_wear',
    title: 'Islamic Wear Department',
    tagline: 'Modest Apparel, Prayer Garments & Community Vestments',
    shortDescription: 'Ethical modest clothing, daily abayas, kurtas, prayer garments, and dignified clothing accessories for men, women, and students.',
    educationalWelfareNote: 'Eligible madrasa scholars and destitute students receive subsidized modesty kits and prayer uniforms funded by educational welfare disbursements.',
    iconName: 'Shirt',
    badge: 'Active Department',
    isActive: true,
    subcategories: [
      "Men's Islamic Wear",
      "Women's Islamic Wear",
      "Children's Islamic Wear",
      "Muslim Wear / Modest Wear",
      "Prayer Wear",
      "Islamic Clothing Accessories"
    ]
  },
  {
    id: 'perfumes',
    slug: 'perfumes',
    categoryKey: 'perfumes',
    title: 'Perfumes & Fragrances Department',
    tagline: 'Alcohol-Free Traditional Attars & Pure Concentrated Oudh',
    shortDescription: 'Non-alcoholic traditional attars, pure botanical fragrance oils, concentrated oudh, and dignified gift sets crafted in accordance with ethical standards.',
    educationalWelfareNote: 'Proceeds from curated traditional fragrances support local livelihood training programs and student welfare initiatives.',
    iconName: 'Sparkles',
    badge: 'Active Department',
    isActive: true,
    subcategories: [
      'Alcohol-Free Perfumes',
      'Attar / Concentrated Perfumes',
      'Fragrance Sets',
      'Other permitted fragrance products'
    ]
  },
  {
    id: 'educational-materials',
    slug: 'educational-materials',
    categoryKey: 'materials',
    title: 'Educational Materials Department',
    tagline: 'Classroom Kits, Scientific Teaching Aids & Student Supplies',
    shortDescription: 'Classroom study kits, laboratory stationery, academic aids, geometric tools, and examination materials for schools and madrasa classrooms.',
    educationalWelfareNote: 'Prescribed scientific kits and classroom teaching aids are distributed at subsidized charitable rates to partner rural institutions across India.',
    iconName: 'GraduationCap',
    badge: 'Active Department',
    isActive: true,
    subcategories: [
      'Study Kits',
      'Stationery & Notebooks',
      'Scientific Teaching Aids',
      'Classroom Charts & Models'
    ]
  },
  {
    id: 'fet-publications',
    slug: 'fet-publications',
    categoryKey: 'publications',
    title: 'FET Publications Department',
    tagline: 'Official Trust Research, Annual Audits & Scholarly Literature',
    shortDescription: 'Official academic research papers, annual statutory audit reports, theological symposium literature, and educational framework monographs published by FET India.',
    educationalWelfareNote: 'Official trust bulletins and statutory reports are maintained under public open access to ensure institutional transparency and scholastic dissemination.',
    iconName: 'FileText',
    badge: 'Active Department',
    isActive: true,
    subcategories: [
      'Research Papers',
      'Theological Symposiums',
      'Annual Reports & Audits',
      'Curriculum Frameworks'
    ]
  },
  {
    id: 'books',
    slug: 'books',
    categoryKey: 'books',
    title: 'Books & Prescribed Curricula',
    tagline: 'Mandatory Core Category: Syllabus Books & Ethical Literature',
    shortDescription: "Official prescribed syllabus textbooks, competition mastery texts, children's moral stories, and character building literature published or recommended by FET India.",
    educationalWelfareNote: 'Under the National Book Reading Initiative, core syllabus books are distributed to thousands of students annually through subsidized scholarships.',
    iconName: 'BookOpen',
    badge: 'Core Department',
    isActive: true,
    subcategories: [
      'Islamic Books',
      'Educational Books',
      "Children's Books",
      'FET Publications',
      'Other Books'
    ]
  },
  {
    id: 'digital',
    slug: 'digital',
    categoryKey: 'digital',
    title: 'Digital Resources Department',
    tagline: 'Expandable Future Department: E-Books & Multimedia Lectures',
    shortDescription: 'Downloadable syllabus e-books, competition audio guides, and digital study resources. Full catalogue expansion scheduled for upcoming series.',
    educationalWelfareNote: 'Digital study repositories provide zero-cost open access to rural scholars seeking distance learning and talent competition preparation.',
    iconName: 'Laptop',
    badge: 'Future Department',
    isActive: false,
    subcategories: [
      'E-Books & PDFs',
      'Audio & Video Lectures',
      'Digital Study Guides',
      'Competition Mock Tests'
    ]
  },
  {
    id: 'merchandise',
    slug: 'merchandise',
    categoryKey: 'merchandise',
    title: 'Trust Merchandise Department',
    tagline: 'Expandable Future Department: Insignia Pins, Plaques & Uniforms',
    shortDescription: 'Trust commemorative emblems, institutional insignia badges, student uniforms, and commemorative charity items.',
    educationalWelfareNote: 'Merchandise contributions fund community youth activities and student leadership recognition events.',
    iconName: 'Package',
    badge: 'Future Department',
    isActive: false,
    subcategories: [
      'Trust Badges & Pins',
      'Commemorative Plaques',
      'Institution Uniforms',
      'Charity Gift Items'
    ]
  },
  {
    id: 'islamic-educational-products',
    slug: 'islamic-educational-products',
    categoryKey: 'islamic_educational_products',
    title: 'Islamic & Educational Products',
    tagline: 'Expandable Future Department: Ethical Tools & Learning Aids',
    shortDescription: 'Integrated Islamic learning apparatus, prayer times clocks, calligraphy study instruments, and educational artifacts for academic excellence.',
    educationalWelfareNote: 'Preserved for upcoming educational development expansions funded under Trust welfare guidelines.',
    iconName: 'Building',
    badge: 'Future Department',
    isActive: false,
    subcategories: [
      'Learning Artifacts',
      'Calligraphy Kits',
      'Classroom Apparatus',
      'Study Accessories'
    ]
  },
  {
    id: 'other-products',
    slug: 'other-products',
    categoryKey: 'other_products',
    title: 'Other Products & Welfare Essentials',
    tagline: 'Expandable Future Department: General Trust Offerings',
    shortDescription: 'General authorized trust articles, welfare items, and secondary supplies maintained for comprehensive store taxonomy coverage.',
    educationalWelfareNote: 'Framework reserved for future authorized community and institutional welfare essentials.',
    iconName: 'Package',
    badge: 'Future Department',
    isActive: false,
    subcategories: [
      'General Welfare Articles',
      'Seasonal Supplies',
      'Institutional Essentials'
    ]
  }
];

export function normalizeDepartmentSlug(slug: string): string {
  const clean = slug.toLowerCase().trim().replace(/[_]/g, '-');
  if (clean === 'islamic-wear' || clean === 'islamicwear') return 'islamic-wear';
  if (clean === 'perfumes' || clean === 'perfume' || clean === 'attar') return 'perfumes';
  if (clean === 'educational-materials' || clean === 'materials' || clean === 'education') return 'educational-materials';
  if (clean === 'fet-publications' || clean === 'publications' || clean === 'publication') return 'fet-publications';
  if (clean === 'books' || clean === 'book') return 'books';
  if (clean === 'digital' || clean === 'digital-resources') return 'digital';
  if (clean === 'merchandise') return 'merchandise';
  if (clean === 'islamic-educational-products' || clean === 'islamic-educational') return 'islamic-educational-products';
  if (clean === 'other-products' || clean === 'other') return 'other-products';
  return clean;
}

export function getDepartmentBySlug(slug: string): StoreDepartmentInfo | undefined {
  const norm = normalizeDepartmentSlug(slug);
  return STORE_DEPARTMENTS.find(d => d.slug === norm || d.id === norm || d.categoryKey === slug || d.categoryKey === norm);
}
