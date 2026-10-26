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

import { StoreProduct } from '../types';

export const STORE_DEMO_PRODUCTS: StoreProduct[] = [
  // 1. ISLAMIC WEAR DEMO PRODUCT
  {
    id: 'demo-prod-islamic-wear-01',
    name: '[Demo Product] Premium Modest Abaya & Prayer Set',
    slug: 'demo-premium-modest-abaya-prayer-set',
    description: `Demo Product / Test Item: High-quality modest apparel tailored for daily and formal prayer wear with dignified drape, breathable fabric, and matched scarf.

Note: This is a clearly labelled demonstration catalogue record prepared for FET Store testing, category routing, and variant evaluation. Not an approved commercial transaction item.`,
    category: 'islamic_wear',
    categoryName: 'Islamic Wear',
    subCategory: "Women's Islamic Wear",
    productType: 'merchandise',
    price: 1450,
    mrp: 1850,
    availability: 'in_stock',
    isAvailable: true,
    trackInventory: true,
    stockCount: 25,
    lowStockThreshold: 5,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: 'both',
    sku: 'DEMO-IW-ABY-01',
    authorOrPublisher: 'FET Modest Apparel Guild (Demo)',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    productImages: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      'Demo Test Product (Not for sale)',
      'Breathable Crepe Fabric',
      'Multiple Size & Color Options',
      'Full-Length Modest Silhouette'
    ],
    hasVariants: true,
    variantOptions: [
      { name: 'Size', values: ['S (52)', 'M (54)', 'L (56)', 'XL (58)'] },
      { name: 'Color', values: ['Classic Black', 'Navy Blue'] }
    ],
    variants: [
      {
        id: 'var-iw-s-black',
        name: 'Size S (52) / Classic Black',
        sku: 'DEMO-IW-S-BLK',
        price: 1450,
        mrp: 1850,
        availability: 'in_stock',
        isAvailable: true,
        stockCount: 8,
        attributes: { Size: 'S (52)', Color: 'Classic Black' }
      },
      {
        id: 'var-iw-m-black',
        name: 'Size M (54) / Classic Black',
        sku: 'DEMO-IW-M-BLK',
        price: 1450,
        mrp: 1850,
        availability: 'in_stock',
        isAvailable: true,
        stockCount: 12,
        attributes: { Size: 'M (54)', Color: 'Classic Black' }
      },
      {
        id: 'var-iw-l-black',
        name: 'Size L (56) / Classic Black',
        sku: 'DEMO-IW-L-BLK',
        price: 1450,
        mrp: 1850,
        availability: 'in_stock',
        isAvailable: true,
        stockCount: 5,
        attributes: { Size: 'L (56)', Color: 'Classic Black' }
      },
      {
        id: 'var-iw-m-navy',
        name: 'Size M (54) / Navy Blue',
        sku: 'DEMO-IW-M-NVY',
        price: 1450,
        mrp: 1850,
        availability: 'in_stock',
        isAvailable: true,
        stockCount: 4,
        attributes: { Size: 'M (54)', Color: 'Navy Blue' }
      }
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z'
  },

  // 2. PERFUMES DEMO PRODUCT
  {
    id: 'demo-prod-perfume-01',
    name: '[Demo Product] Pure Concentrated Oudh Attar (Alcohol-Free)',
    slug: 'demo-pure-concentrated-oudh-attar',
    description: `Demo Product / Test Item: Pure alcohol-free concentrated botanical attar formulated according to traditional halal distillation methods. Long-lasting, warm oriental amber and agarwood notes.

Note: This is a clearly labelled demonstration catalogue record prepared for FET Store testing, category routing, and fragrance volume testing. Not an approved commercial transaction item.`,
    category: 'perfumes',
    categoryName: 'Perfumes',
    subCategory: 'Attar / Concentrated Perfumes',
    productType: 'physical',
    price: 450,
    mrp: 600,
    availability: 'in_stock',
    isAvailable: true,
    trackInventory: true,
    stockCount: 40,
    lowStockThreshold: 10,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: 'both',
    sku: 'DEMO-PF-OUD-01',
    authorOrPublisher: 'FET Traditional Fragrance Arts (Demo)',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    productImages: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      'Demo Test Product (Not for sale)',
      '100% Non-Alcoholic Formulation',
      'Concentrated Botanical Perfume Oil',
      'Traditional Glass Applicator Bottle'
    ],
    hasVariants: true,
    variantOptions: [
      { name: 'Volume', values: ['6ml Roll-on', '12ml Crystal Vial'] }
    ],
    variants: [
      {
        id: 'var-pf-6ml',
        name: 'Volume 6ml Roll-on',
        sku: 'DEMO-PF-6ML',
        price: 450,
        mrp: 600,
        availability: 'in_stock',
        isAvailable: true,
        stockCount: 25,
        attributes: { Volume: '6ml Roll-on' }
      },
      {
        id: 'var-pf-12ml',
        name: 'Volume 12ml Crystal Vial',
        sku: 'DEMO-PF-12ML',
        price: 850,
        mrp: 1100,
        availability: 'in_stock',
        isAvailable: true,
        stockCount: 15,
        attributes: { Volume: '12ml Crystal Vial' }
      }
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z'
  },

  // 3. EDUCATIONAL MATERIALS DEMO PRODUCT (COD ONLY DEMO)
  {
    id: 'demo-prod-materials-01',
    name: '[Demo Product] Secondary Science & Mathematics Classroom Study Kit',
    slug: 'demo-secondary-science-mathematics-study-kit',
    description: `Demo Product / Test Item: Comprehensive curriculum kit containing scientific teaching aids, geometric apparatus, student workbooks, and experimental observation charts tailored for high school laboratories and madrasa science rooms.

Note: This is a clearly labelled demonstration catalogue record prepared for FET Store testing and educational department verification. Not an approved commercial transaction item.`,
    category: 'materials',
    categoryName: 'Educational Materials',
    subCategory: 'Study Kits',
    productType: 'educational_material',
    price: 380,
    mrp: 500,
    availability: 'in_stock',
    isAvailable: true,
    trackInventory: true,
    stockCount: 15,
    lowStockThreshold: 3,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: 'cod',
    sku: 'DEMO-MAT-KIT-01',
    authorOrPublisher: 'FET Academic Research & Laboratory Directorate (Demo)',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    productImages: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      'Demo Test Product (Not for sale)',
      'Classroom Visual Aids & Demonstration Tools',
      'Aligned with NCERT & State Science Syllabi',
      'Durable Non-Toxic Educational Components'
    ],
    hasVariants: false,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z'
  },

  // 4. FET PUBLICATIONS DEMO PRODUCT
  {
    id: 'demo-prod-publication-01',
    name: '[Demo Product] FET Annual Educational & Welfare Research Bulletin 2024-25',
    slug: 'demo-fet-annual-educational-welfare-bulletin-2024-25',
    description: `Demo Product / Test Item: Official academic research paper detailing scholarship metrics, rural learning outcomes, madrasa curriculum modernization, and grassroots community impact audits across Indian states.

Note: This is a clearly labelled demonstration publication prepared for FET Store testing. Digital PDF is downloadable for public audit and verification.`,
    category: 'publications',
    categoryName: 'FET Publications',
    subCategory: 'Annual Reports & Audits',
    productType: 'publication',
    price: 0,
    mrp: 150,
    availability: 'in_stock',
    isAvailable: true,
    trackInventory: false,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: 'razorpay',
    sku: 'DEMO-PUB-REP-2025',
    authorOrPublisher: 'FET Research, Audits & Publications Council',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    productImages: [
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      'Demo Test Publication (Public Open Access)',
      'Independent Statutory & Academic Review',
      'State-Wise Scholarship Disbursements Data',
      'Includes Official Audit Statements'
    ],
    isDigital: true,
    digitalAsset: {
      fileName: 'FET-Annual-Educational-Research-Bulletin-2024-25-Demo.pdf',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: 2450000,
      fileType: 'application/pdf',
      accessType: 'public_download',
      pageCount: 64,
      uploadedAt: '2026-01-10T10:00:00Z',
      description: 'Official Demo Research Bulletin (Public Open Access PDF)'
    },
    language: 'English & Urdu',
    edition: '2024-2025 Edition',
    format: 'Digital PDF',
    pagesCount: 64,
    hasVariants: false,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z'
  },

  // 5. BOOKS DEMO PRODUCT (CORE BOOKS CATEGORY - RAZORPAY ONLY DEMO)
  {
    id: 'demo-prod-book-01',
    name: '[Demo Product] Prescribed Ethical Reader & Character Building Curriculum',
    slug: 'demo-prescribed-ethical-reader-character-building',
    description: `Demo Product / Test Item: Prescribed ethical curriculum reader for primary and secondary youth featuring moral case studies, historical integrity examples, and interactive character quizzes.

Note: This is a clearly labelled demonstration book record prepared for FET Store testing, format variation (Paperback vs Digital PDF), and language selection.`,
    category: 'books',
    categoryName: 'Books',
    subCategory: 'Educational Books',
    productType: 'book',
    price: 180,
    mrp: 240,
    availability: 'in_stock',
    isAvailable: true,
    trackInventory: true,
    stockCount: 50,
    lowStockThreshold: 10,
    isPublished: true,
    isActive: true,
    isArchived: false,
    isDemo: true,
    paymentMethods: 'razorpay',
    sku: 'DEMO-BK-ETH-01',
    authorOrPublisher: 'FET Academic Curriculum & Values Bureau',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    productImages: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'
    ],
    features: [
      'Demo Test Book (For Testing Only)',
      'Approved for Youth Moral Curriculum',
      'Bilingual Exercises & Guided Questions',
      'High-Grade Matte Paper Bound Edition'
    ],
    language: 'English & Urdu',
    edition: '1st Revised Edition 2025',
    format: 'Paperback',
    pagesCount: 168,
    hasVariants: true,
    variantOptions: [
      { name: 'Format', values: ['Paperback (Printed)', 'Digital PDF E-Book'] }
    ],
    variants: [
      {
        id: 'var-bk-paperback',
        name: 'Format Paperback (Printed)',
        sku: 'DEMO-BK-ETH-PB',
        price: 180,
        mrp: 240,
        availability: 'in_stock',
        isAvailable: true,
        stockCount: 50,
        attributes: { Format: 'Paperback (Printed)' }
      },
      {
        id: 'var-bk-pdf',
        name: 'Format Digital PDF E-Book',
        sku: 'DEMO-BK-ETH-PDF',
        price: 90,
        mrp: 150,
        availability: 'in_stock',
        isAvailable: true,
        isDigital: true,
        digitalAsset: {
          fileName: 'Prescribed-Ethical-Reader-Demo-Sample.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileSize: 1800000,
          fileType: 'application/pdf',
          accessType: 'sample_preview',
          pageCount: 168,
          previewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          description: 'Demo Sample Chapters (PDF E-Book)'
        },
        attributes: { Format: 'Digital PDF E-Book' }
      }
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z'
  }
];
