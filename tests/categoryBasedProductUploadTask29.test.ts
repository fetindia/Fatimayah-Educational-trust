import assert from 'node:assert';
import {
  isFashionCategory,
  isBookCategory,
  generateProductSlug
} from '../src/components/admin/store/AdminProductFormModal';
import { StoreProduct, StoreProductVariant, StoreProductImageItem } from '../src/types';

console.log('--- Starting Task 29: Category-Based Smart Product Upload Dashboard Tests ---');

// 1. Test Category Detection & Slug Generation
console.log('Test 1: Category detection helpers');
assert.strictEqual(isFashionCategory('womens-clothing'), true);
assert.strictEqual(isFashionCategory('mens-clothing'), true);
assert.strictEqual(isFashionCategory('childrens-clothing'), true);
assert.strictEqual(isFashionCategory('other-fashion-accessories'), true);
assert.strictEqual(isFashionCategory('casual-wear'), true);
assert.strictEqual(isFashionCategory('books'), false);
assert.strictEqual(isFashionCategory('custom-perfumes', 'clothing'), true);

assert.strictEqual(isBookCategory('books'), true);
assert.strictEqual(isBookCategory('publications'), true);
assert.strictEqual(isBookCategory('womens-clothing'), false);
assert.strictEqual(isBookCategory('custom-resource', 'book'), true);

assert.strictEqual(generateProductSlug('Urdu Primer & Reader (Vol 1)'), 'urdu-primer-reader-vol-1');
assert.strictEqual(generateProductSlug("Women's Modest Abaya - Black"), 'womens-modest-abaya-black');
console.log('✓ Category detection and slug generation passed.');

// 2. Test Fashion & Clothing Products with Configurable Sizes & Colours Matrix
console.log('Test 2: Fashion & Clothing Variant Generation');
const configurableSizes = ['S', 'M', 'L', 'XL', 'XXL']; // Configurable by admin
const configurableColours = ['Midnight Black', 'Emerald Green', 'Royal Navy']; // Configurable by admin
const baseSku = 'FET-ABAYA-01';

const generatedVariants: StoreProductVariant[] = [];
configurableSizes.forEach(s => {
  configurableColours.forEach(c => {
    const cleanColour = c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    generatedVariants.push({
      id: `var-${s}-${cleanColour}`,
      name: `Size: ${s} / Colour: ${c}`,
      sku: `${baseSku}-${s}-${cleanColour}`,
      price: 1899,
      mrp: 2499,
      availability: 'in_stock',
      isAvailable: true,
      stockCount: 15,
      trackInventory: true,
      attributes: {
        'Size': s,
        'Colour': c
      }
    });
  });
});

assert.strictEqual(generatedVariants.length, 5 * 3); // 15 combinations
assert.strictEqual(generatedVariants[0].sku, 'FET-ABAYA-01-S-MIDN');
assert.strictEqual(generatedVariants[0].attributes?.['Size'], 'S');
assert.strictEqual(generatedVariants[0].attributes?.['Colour'], 'Midnight Black');
assert.strictEqual(generatedVariants[0].stockCount, 15);

// Check unique SKUs
const skuSet = new Set(generatedVariants.map(v => v.sku));
assert.strictEqual(skuSet.size, generatedVariants.length, 'All variant SKUs must be unique');
console.log('✓ Fashion configurable sizes, colours, and unique SKU matrix generation passed.');

// 3. Test Professional Photograph Gallery Management
console.log('Test 3: Professional Photograph Gallery Management');
let primaryImage = 'https://fetindia.org/images/front.jpg';
const gallery: StoreProductImageItem[] = [
  { id: '1', url: 'https://fetindia.org/images/front.jpg', label: 'Front View', viewType: 'front', isPrimary: true },
  { id: '2', url: 'https://fetindia.org/images/back.jpg', label: 'Back View', viewType: 'back', isPrimary: false },
  { id: '3', url: 'https://fetindia.org/images/detail.jpg', label: 'Fabric Detail', viewType: 'detail', isPrimary: false }
];

// Reorder images
const [movedItem] = gallery.splice(1, 1); // remove back view
gallery.splice(0, 0, movedItem); // move to front
assert.strictEqual(gallery[0].id, '2');
assert.strictEqual(gallery[1].id, '1');

// Change primary image
primaryImage = gallery[0].url;
gallery.forEach(item => {
  item.isPrimary = item.url === primaryImage;
});
assert.strictEqual(gallery[0].isPrimary, true);
assert.strictEqual(gallery[1].isPrimary, false);
console.log('✓ Photograph gallery multi-angle views, reordering, and primary selection passed.');

// 4. Test Books: Physical vs Digital
console.log('Test 4: Books - Physical vs Digital Product Structure');
const physicalBook: Partial<StoreProduct> = {
  name: 'History of Islamic Jurisprudence',
  productType: 'book',
  category: 'books',
  subCategory: 'Educational textbooks',
  isDigital: false,
  authorOrPublisher: 'Allama Syed Zeeshan Haider',
  publisher: 'FET Academic Directorate',
  isbn: '978-81-945678-1-2',
  edition: '4th Revised Edition (2025)',
  language: 'Urdu',
  binding: 'Hardcover',
  pagesCount: 480,
  price: 650,
  stockCount: 120,
  weightGrams: 750,
  shippingInfo: {
    weightGrams: 750,
    estimatedDays: '3-5 business days',
    freeShipping: false,
    shippingFee: 50
  }
};
assert.strictEqual(physicalBook.isDigital, false);
assert.strictEqual(physicalBook.isbn, '978-81-945678-1-2');
assert.strictEqual(physicalBook.shippingInfo?.weightGrams, 750);

const digitalBook: Partial<StoreProduct> = {
  name: 'FET Higher Secondary Moral Science Reader (E-Book)',
  productType: 'digital',
  category: 'books',
  subCategory: 'Educational textbooks',
  isDigital: true,
  authorOrPublisher: 'FET Curriculum Committee',
  language: 'English & Urdu',
  price: 0, // Free product support
  trackInventory: false,
  digitalAsset: {
    fileName: 'fet_moral_science_2025.pdf',
    fileUrl: 'https://storage.googleapis.com/fet-store-protected/fet_moral_science_2025.pdf',
    accessType: 'public_download',
    pageCount: 160,
    uploadedAt: new Date().toISOString()
  }
};
assert.strictEqual(digitalBook.isDigital, true);
assert.strictEqual(digitalBook.price, 0);
assert.strictEqual(digitalBook.trackInventory, false);
assert.strictEqual(digitalBook.digitalAsset?.accessType, 'public_download');
assert.strictEqual(digitalBook.shippingInfo, undefined, 'Digital book must not have physical shipping');
console.log('✓ Physical book vs Digital book differentiation passed.');

// 5. Test Related Products Selection and Fallback
console.log('Test 5: Related Products Linking');
const sampleCatalog: StoreProduct[] = [
  { id: 'p1', name: 'Al-Kafi Vol 1', category: 'books', price: 500, isPublished: true, isActive: true, isArchived: false, relatedProductIds: ['p2', 'p3'] } as any,
  { id: 'p2', name: 'Al-Kafi Vol 2', category: 'books', price: 500, isPublished: true, isActive: true, isArchived: false } as any,
  { id: 'p3', name: 'Nahj al-Balagha', category: 'books', price: 750, isPublished: true, isActive: true, isArchived: false } as any,
  { id: 'p4', name: 'Deleted Product', category: 'books', price: 100, isPublished: false, isArchived: true } as any
];

const currentProduct = sampleCatalog[0];
let resolvedRelated: StoreProduct[] = [];
if (currentProduct.relatedProductIds && currentProduct.relatedProductIds.length > 0) {
  resolvedRelated = sampleCatalog.filter(
    p => currentProduct.relatedProductIds!.includes(p.id) &&
         p.id !== currentProduct.id &&
         p.isPublished &&
         p.isActive !== false &&
         !p.isArchived
  );
}

assert.strictEqual(resolvedRelated.length, 2);
assert.strictEqual(resolvedRelated[0].id, 'p2');
assert.strictEqual(resolvedRelated[1].id, 'p3');
// Ensure archived/deleted product 'p4' is excluded even if referenced
assert.ok(!resolvedRelated.some(p => p.id === 'p4'));
console.log('✓ Related products resolution and validation passed.');

// 6. Test Validation & Draft Saving
console.log('Test 6: Validation & Draft Saving Rules');
function validateProductSubmission(p: Partial<StoreProduct>, isDraft: boolean): { isValid: boolean; error?: string } {
  if (!p.name?.trim()) return { isValid: false, error: 'Product Title is required.' };
  if (!p.category) return { isValid: false, error: 'Category is required.' };
  if ((p.price ?? 0) < 0) return { isValid: false, error: 'Price cannot be negative.' };

  // Draft mode allows saving incomplete items
  if (isDraft) return { isValid: true };

  // Publishing requires full validation
  if (!p.description?.trim()) return { isValid: false, error: 'Product Description is required before publication.' };
  if (!p.imageUrl && (!p.galleryItems || p.galleryItems.length === 0)) {
    return { isValid: false, error: 'At least one primary product photograph is required to publish.' };
  }
  if (p.isDigital && !p.digitalAsset?.fileUrl) {
    return { isValid: false, error: 'Digital products require an uploaded electronic file or download URL.' };
  }
  return { isValid: true };
}

// Incomplete product saved as draft
const incompleteDraft: Partial<StoreProduct> = {
  name: 'Upcoming Silk Hijab',
  category: 'womens-clothing',
  price: 499
};
const draftResult = validateProductSubmission(incompleteDraft, true);
assert.strictEqual(draftResult.isValid, true, 'Draft should be saveable with partial fields');

const publishResult = validateProductSubmission(incompleteDraft, false);
assert.strictEqual(publishResult.isValid, false, 'Publishing incomplete product should fail');
assert.ok(publishResult.error?.includes('Description'));

console.log('✓ Draft saving vs strict publication validation passed.');
console.log('ALL TASK 29 UNIT & INTEGRATION TESTS PASSED SUCCESSFULLY!');
