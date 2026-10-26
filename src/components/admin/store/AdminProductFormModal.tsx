/**
 * @license
 * Admin Product Form Modal (Task 29 - Category-Based Smart Product Upload Dashboard)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides an intelligent, category-specific product upload and editing experience
 * organized into 10 structured sections:
 * 1. Product type
 * 2. Main category
 * 3. Subcategory
 * 4. Product name and description
 * 5. Product photographs (professional multi-angle gallery, reordering, validation)
 * 6. Category-specific attributes (Clothing/Fashion matrix, Physical Books, Digital Books)
 * 7. Price, stock, and availability
 * 8. Related products (search, selection, ID references)
 * 9. Shipping or digital-delivery details
 * 10. Save draft, preview, and publish actions
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Package,
  ShieldCheck,
  RefreshCw,
  Layers,
  ArrowUpRight,
  BookOpen,
  Upload,
  Image as ImageIcon,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Info,
  FileText,
  Download,
  Lock,
  Shirt,
  Sparkles,
  Truck,
  DollarSign,
  Maximize2,
  Droplet
} from 'lucide-react';
import {
  StoreProduct,
  StoreCategory,
  StoreProductType,
  StoreProductAvailability,
  StoreProductStatus,
  StoreProductOption,
  StoreProductVariant,
  StoreDigitalAsset,
  StoreDigitalAccessType,
  StoreProductImageItem,
  StoreImageViewType
} from '../../../types';
import { uploadStoreProductImage, uploadStoreDigitalFile } from '../../../lib/storage';

export interface AdminProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: StoreProduct | null;
  categories: StoreCategory[];
  allProducts: StoreProduct[];
  onSave: (payload: any, isDraft: boolean) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const generateProductSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const isFashionCategory = (catSlugOrName: string, productType?: string): boolean => {
  const norm = (catSlugOrName || '').toLowerCase().trim();
  return (
    productType === 'clothing' ||
    productType === 'fashion' ||
    norm.includes('cloth') ||
    norm.includes('fashion') ||
    norm.includes('wear') ||
    norm.includes('dress') ||
    norm === 'womens-clothing' ||
    norm === 'mens-clothing' ||
    norm === 'childrens-clothing' ||
    norm === 'other-fashion-accessories' ||
    norm === 'islamic-wear'
  );
};

export const isBookCategory = (catSlugOrName: string, productType?: string): boolean => {
  const norm = (catSlugOrName || '').toLowerCase().trim();
  return (
    productType === 'book' ||
    productType === 'publication' ||
    norm.includes('book') ||
    norm.includes('publication') ||
    norm === 'books' ||
    norm === 'publications'
  );
};

export const isPerfumeCategory = (catSlugOrName: string, productType?: string): boolean => {
  const norm = (catSlugOrName || '').toLowerCase().trim();
  return (
    productType === 'perfume' ||
    productType === 'fragrance' ||
    norm.includes('perfume') ||
    norm.includes('fragrance') ||
    norm.includes('attar') ||
    norm === 'perfumes' ||
    norm === 'perfumes-fragrances'
  );
};

const VIEW_TYPE_LABELS: Record<StoreImageViewType, string> = {
  front: 'Front View',
  back: 'Back View',
  side: 'Side View',
  detail: 'Detail View',
  model: 'Model / Lifestyle',
  bottle: 'Main Bottle View',
  box: 'Box / Packaging',
  packaging: 'Box / Packaging',
  label: 'Label & Ingredients',
  ingredients: 'Label & Ingredients',
  other: 'General View'
};

const DEFAULT_BOOK_SUBCATEGORIES = [
  'Educational textbooks',
  'Competitive examination books',
  "Children's books",
  'Storybooks and literature',
  'Religious and cultural books',
  'FET Publications',
  'Other Books'
];

const DEFAULT_PERFUME_SUBCATEGORIES = [
  "Women's Perfumes",
  "Men's Perfumes",
  "Unisex Perfumes",
  "Eau de Parfum (EDP)",
  "Eau de Toilette (EDT)",
  "Attar and concentrated perfume oils",
  "Perfume gift sets",
  "Body mists and fragrance sprays",
  "Other Fragrance Categories"
];

export const AdminProductFormModal: React.FC<AdminProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  categories,
  allProducts,
  onSave,
  isSubmitting,
  error: externalError,
  onNotify
}) => {
  // 1. Product Type
  const [productType, setProductType] = useState<StoreProductType>('book');
  const [bookDeliveryNature, setBookDeliveryNature] = useState<'physical' | 'digital'>('physical');

  // 2. Main Category
  const [categorySlug, setCategorySlug] = useState<string>('books');
  const [categoryName, setCategoryName] = useState<string>('Books');
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null);

  // 3. Subcategory
  const [subCategory, setSubCategory] = useState<string>('');
  const [customSubCategory, setCustomSubCategory] = useState<string>('');

  // 4. Product Name & Description
  const [productName, setProductName] = useState<string>('');
  const [productSlug, setProductSlug] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [features, setFeatures] = useState<string>('');

  // 5. Product Photographs (Gallery)
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string>('');
  const [galleryItems, setGalleryItems] = useState<StoreProductImageItem[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageViewType, setNewImageViewType] = useState<StoreImageViewType>('front');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 6. Category-Specific Attributes
  // Clothing / Fashion Attributes
  const [brand, setBrand] = useState<string>('');
  const [garmentType, setGarmentType] = useState<string>('');
  const [fabric, setFabric] = useState<string>('');
  const [fit, setFit] = useState<string>('');
  const [style, setStyle] = useState<string>('');
  const [clothingGender, setClothingGender] = useState<'women' | 'men' | 'children' | 'unisex'>('women');
  
  // Clothing Sizes & Colours Configurable Lists
  const [clothingSizes, setClothingSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [newSizeInput, setNewSizeInput] = useState<string>('');
  const [clothingColours, setClothingColours] = useState<string[]>(['Black', 'Navy Blue', 'Maroon']);
  const [newColourInput, setNewColourInput] = useState<string>('');

  // Perfumes & Fragrances Attributes (Task 30)
  const [fragranceName, setFragranceName] = useState<string>('');
  const [perfumeAudience, setPerfumeAudience] = useState<'women' | 'men' | 'unisex'>('unisex');
  const [fragranceConcentration, setFragranceConcentration] = useState<string>('edp');
  const [bottleSizes, setBottleSizes] = useState<string[]>(['10 ml', '30 ml', '50 ml', '100 ml']);
  const [newBottleSizeInput, setNewBottleSizeInput] = useState<string>('');
  const [topNotes, setTopNotes] = useState<string>('');
  const [middleNotes, setMiddleNotes] = useState<string>('');
  const [baseNotes, setBaseNotes] = useState<string>('');
  const [fragranceFamily, setFragranceFamily] = useState<string>('Woody');
  const [countryOfOrigin, setCountryOfOrigin] = useState<string>('India');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [ingredients, setIngredients] = useState<string>('');

  // Product-Level Payment Eligibility (Task 30)
  const [paymentMethods, setPaymentMethods] = useState<'cod' | 'razorpay' | 'both'>('both');

  // Book & Publication Attributes
  const [author, setAuthor] = useState<string>('');
  const [publisher, setPublisher] = useState<string>('');
  const [isbn, setIsbn] = useState<string>('');
  const [edition, setEdition] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [pagesCount, setPagesCount] = useState<number | ''>('');
  const [binding, setBinding] = useState<string>('');

  // Digital Book / Digital Asset Attributes
  const [isDigital, setIsDigital] = useState<boolean>(false);
  const [digitalAsset, setDigitalAsset] = useState<StoreDigitalAsset | null>(null);
  const [digitalFileName, setDigitalFileName] = useState<string>('');
  const [digitalFileUrl, setDigitalFileUrl] = useState<string>('');
  const [digitalAccessType, setDigitalAccessType] = useState<StoreDigitalAccessType>('public_download');
  const [digitalPreviewUrl, setDigitalPreviewUrl] = useState<string>('');
  const [digitalFormat, setDigitalFormat] = useState<string>('PDF');
  const [isUploadingDigital, setIsUploadingDigital] = useState<boolean>(false);
  const [digitalUploadProgress, setDigitalUploadProgress] = useState<number>(0);
  const digitalFileInputRef = useRef<HTMLInputElement>(null);

  // General Attributes
  const [sku, setSku] = useState<string>('');

  // Variants (Size & Colour matrix or general variants)
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [variants, setVariants] = useState<StoreProductVariant[]>([]);

  // 7. Price, Stock, and Availability
  const [price, setPrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [trackInventory, setTrackInventory] = useState<boolean>(true);
  const [stockCount, setStockCount] = useState<number>(25);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [availability, setAvailability] = useState<StoreProductAvailability>('in_stock');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [status, setStatus] = useState<StoreProductStatus>('ACTIVE');
  const [isPublished, setIsPublished] = useState<boolean>(true);

  // 8. Related Products
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
  const [relatedSearchQuery, setRelatedSearchQuery] = useState<string>('');

  // 9. Shipping / Delivery Details
  const [weightGrams, setWeightGrams] = useState<number | ''>('');
  const [estimatedDays, setEstimatedDays] = useState<string>('3-5 business days');
  const [freeShipping, setFreeShipping] = useState<boolean>(false);
  const [shippingFee, setShippingFee] = useState<number | ''>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  // 10. Live Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewSelectedVariantId, setPreviewSelectedVariantId] = useState<string | null>(null);
  const [previewActiveImage, setPreviewActiveImage] = useState<string>('');

  // Form Validation & Local Error
  const [localError, setLocalError] = useState<string | null>(null);

  // Initialize or Reset Form
  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setProductName(editingProduct.name || '');
      setProductSlug(editingProduct.slug || generateProductSlug(editingProduct.name || ''));
      setDescription(editingProduct.description || '');
      setCategorySlug(editingProduct.category || 'books');
      setCategoryName(editingProduct.categoryName || editingProduct.category || 'Books');
      setSubCategory(editingProduct.subCategory || '');
      setCustomSubCategory('');
      setProductType(editingProduct.productType || 'book');
      setPrice(editingProduct.price ?? 0);
      setMrp(editingProduct.mrp ?? 0);
      setAvailability(editingProduct.availability || 'in_stock');
      const isAvail = editingProduct.isAvailable !== false && editingProduct.availability !== 'unavailable' && editingProduct.availability !== 'out_of_stock';
      setIsAvailable(isAvail);
      setTrackInventory(editingProduct.trackInventory !== false && editingProduct.productType !== 'digital');
      setStockCount(editingProduct.stockCount ?? 0);
      setLowStockThreshold(editingProduct.lowStockThreshold ?? 5);
      setStatus((editingProduct.status as StoreProductStatus) || (editingProduct.isActive === false ? 'INACTIVE' : 'ACTIVE'));
      setIsPublished(editingProduct.isPublished ?? true);
      setSku(editingProduct.sku || '');
      setPrimaryImageUrl(editingProduct.imageUrl || editingProduct.productImages?.[0] || '');

      // Load gallery items
      if (editingProduct.galleryItems && editingProduct.galleryItems.length > 0) {
        setGalleryItems(editingProduct.galleryItems);
      } else if (editingProduct.productImages && editingProduct.productImages.length > 0) {
        setGalleryItems(
          editingProduct.productImages.map((url, i) => ({
            id: `img-${i}`,
            url,
            label: i === 0 ? 'Front View' : `View ${i + 1}`,
            viewType: i === 0 ? 'front' : 'other',
            isPrimary: url === editingProduct.imageUrl
          }))
        );
      } else {
        setGalleryItems([]);
      }

      setAuthor(editingProduct.authorOrPublisher || '');
      setPublisher(editingProduct.publisher || '');
      setIsbn(editingProduct.isbn || '');
      setEdition(editingProduct.edition || '');
      setLanguage(editingProduct.language || '');
      setBinding(editingProduct.binding || '');
      setPagesCount(editingProduct.pagesCount ?? '');
      setFeatures((editingProduct.features || []).join(', '));

      // Clothing attributes
      setBrand(editingProduct.brand || '');
      setGarmentType(editingProduct.subCategory || '');
      setFabric(editingProduct.fabric || '');
      setFit(editingProduct.fit || '');
      setStyle(editingProduct.style || '');
      setClothingGender(editingProduct.clothingGender || 'women');

      // Variants
      setHasVariants(editingProduct.hasVariants ?? false);
      const loadedVariants = editingProduct.variants || [];
      setVariants(loadedVariants);

      // Extract existing sizes and colours from variants if available
      const extractedSizes = new Set<string>();
      const extractedColours = new Set<string>();
      loadedVariants.forEach(v => {
        if (v.attributes?.['Size'] || v.attributes?.['size']) {
          extractedSizes.add(v.attributes['Size'] || v.attributes['size']);
        }
        if (v.attributes?.['Color'] || v.attributes?.['Colour'] || v.attributes?.['color']) {
          extractedColours.add(v.attributes['Color'] || v.attributes['Colour'] || v.attributes['color']);
        }
      });
      if (extractedSizes.size > 0) {
        setClothingSizes(Array.from(extractedSizes));
      }
      if (extractedColours.size > 0) {
        setClothingColours(Array.from(extractedColours));
      }

      // Perfumes & Fragrances Attributes (Task 30)
      setFragranceName(editingProduct.fragranceName || '');
      setPerfumeAudience(editingProduct.perfumeAudience || 'unisex');
      setFragranceConcentration(editingProduct.fragranceConcentration || 'edp');
      setTopNotes(editingProduct.fragranceNotes?.top || '');
      setMiddleNotes(editingProduct.fragranceNotes?.middle || '');
      setBaseNotes(editingProduct.fragranceNotes?.base || '');
      setFragranceFamily(editingProduct.fragranceFamily || 'Woody');
      setCountryOfOrigin(editingProduct.countryOfOrigin || 'India');
      setManufacturer(editingProduct.manufacturer || '');
      setIngredients(editingProduct.ingredients || '');

      // Extract existing bottle sizes if variants exist
      const extractedBottleSizes = new Set<string>();
      loadedVariants.forEach(v => {
        if (v.attributes?.['Bottle Size']) extractedBottleSizes.add(v.attributes['Bottle Size']);
        if (v.attributes?.['Volume']) extractedBottleSizes.add(v.attributes['Volume']);
        if (v.attributes?.['Size'] && !v.attributes?.['Colour'] && !v.attributes?.['Color']) {
          extractedBottleSizes.add(v.attributes['Size']);
        }
      });
      if (extractedBottleSizes.size > 0) {
        setBottleSizes(Array.from(extractedBottleSizes));
      }

      // Product-Level Payment Eligibility (Task 30)
      setPaymentMethods(editingProduct.paymentMethods || 'both');

      // Digital Asset
      const hasDigital = Boolean(editingProduct.isDigital || editingProduct.productType === 'digital' || editingProduct.digitalAsset);
      setIsDigital(hasDigital);
      setBookDeliveryNature(hasDigital ? 'digital' : 'physical');
      setDigitalAsset(editingProduct.digitalAsset || null);
      setDigitalFileName(editingProduct.digitalAsset?.fileName || '');
      setDigitalFileUrl(editingProduct.digitalAsset?.fileUrl || '');
      setDigitalAccessType(editingProduct.digitalAsset?.accessType || 'public_download');
      setDigitalPreviewUrl(editingProduct.digitalAsset?.previewUrl || '');
      setDigitalFormat(editingProduct.format || 'PDF');

      // Shipping & Weight
      setWeightGrams(editingProduct.weightGrams ?? editingProduct.shippingInfo?.weightGrams ?? '');
      setEstimatedDays(editingProduct.shippingInfo?.estimatedDays || '3-5 business days');
      setFreeShipping(editingProduct.shippingInfo?.freeShipping ?? false);
      setShippingFee(editingProduct.shippingInfo?.shippingFee ?? '');
      setDeliveryNotes(editingProduct.shippingInfo?.deliveryNotes || '');

      // Related products
      setRelatedProductIds(editingProduct.relatedProductIds || []);
    } else {
      // New Product Defaults
      setProductName('');
      setProductSlug('');
      setDescription('');
      const defaultCat = categories.find(c => c.slug === 'books') || categories[0];
      setCategorySlug(defaultCat ? defaultCat.slug : 'books');
      setCategoryName(defaultCat ? defaultCat.name : 'Books');
      setSubCategory('');
      setCustomSubCategory('');
      setProductType('book');
      setBookDeliveryNature('physical');
      setPrice(0);
      setMrp(0);
      setAvailability('in_stock');
      setIsAvailable(true);
      setTrackInventory(true);
      setStockCount(25);
      setLowStockThreshold(5);
      setStatus('ACTIVE');
      setIsPublished(true);
      setSku('');
      setPrimaryImageUrl('');
      setGalleryItems([]);
      setAuthor('');
      setPublisher('Fatimyah Educational Trust');
      setIsbn('');
      setEdition('2025 Revised Edition');
      setLanguage('Urdu / English');
      setBinding('Paperback');
      setPagesCount('');
      setFeatures('');
      setBrand('FET Official');
      setGarmentType('');
      setFabric('100% Pure Cotton');
      setFit('Modest Relaxed Fit');
      setStyle('Traditional Daily Wear');
      setClothingGender('women');
      setClothingSizes(['S', 'M', 'L', 'XL']);
      setClothingColours(['Black', 'Navy Blue', 'Maroon']);
      setFragranceName('');
      setPerfumeAudience('unisex');
      setFragranceConcentration('edp');
      setBottleSizes(['10 ml', '30 ml', '50 ml', '100 ml']);
      setNewBottleSizeInput('');
      setTopNotes('');
      setMiddleNotes('');
      setBaseNotes('');
      setFragranceFamily('Woody');
      setCountryOfOrigin('India');
      setManufacturer('');
      setIngredients('');
      setPaymentMethods('both');
      setHasVariants(false);
      setVariants([]);
      setIsDigital(false);
      setDigitalAsset(null);
      setDigitalFileName('');
      setDigitalFileUrl('');
      setDigitalAccessType('public_download');
      setDigitalPreviewUrl('');
      setDigitalFormat('PDF');
      setWeightGrams(350);
      setEstimatedDays('3-5 business days');
      setFreeShipping(false);
      setShippingFee('');
      setDeliveryNotes('');
      setRelatedProductIds([]);
    }

    setCategoryWarning(null);
    setLocalError(null);
  }, [isOpen, editingProduct, categories]);

  // Determine current category characteristics
  const currentCategoryObj = useMemo(() => {
    return categories.find(c => c.slug === categorySlug || c.name === categorySlug) || null;
  }, [categories, categorySlug]);

  const isFashion = useMemo(() => {
    return isFashionCategory(categorySlug, productType) || isFashionCategory(categoryName, productType);
  }, [categorySlug, categoryName, productType]);

  const isBook = useMemo(() => {
    return isBookCategory(categorySlug, productType) || isBookCategory(categoryName, productType);
  }, [categorySlug, categoryName, productType]);

  const isPerfume = useMemo(() => {
    return isPerfumeCategory(categorySlug, productType) || isPerfumeCategory(categoryName, productType);
  }, [categorySlug, categoryName, productType]);

  const isDigitalNature = useMemo(() => {
    return isDigital || productType === 'digital' || (isBook && bookDeliveryNature === 'digital');
  }, [isDigital, productType, isBook, bookDeliveryNature]);

  // Handle Category Change with Warning if Data Exists
  const handleCategoryChange = (newSlug: string) => {
    const found = categories.find(c => c.slug === newSlug || c.name === newSlug);
    const newCatName = found?.name || newSlug;

    // Check if switching between Fashion, Books, and Perfumes with existing category fields
    const wasFashion = isFashion;
    const willBeFashion = isFashionCategory(newSlug);
    const wasBook = isBook;
    const willBeBook = isBookCategory(newSlug);
    const wasPerfume = isPerfume;
    const willBePerfume = isPerfumeCategory(newSlug);

    if (wasFashion && !willBeFashion && (variants.length > 0 || brand || fabric)) {
      setCategoryWarning('Category switched from clothing. Your fashion variants and fabric attributes will be preserved in the draft, but hidden unless clothing is reselected.');
    } else if (wasBook && !willBeBook && (isbn || publisher || digitalFileUrl)) {
      setCategoryWarning('Category switched from books. Your book publishing and digital file details will be preserved in the draft, but hidden unless books are reselected.');
    } else if (wasPerfume && !willBePerfume && (fragranceName || topNotes || manufacturer || bottleSizes.length > 0)) {
      setCategoryWarning('Category switched from perfumes. Your fragrance notes and bottle-size configurations will be preserved in the draft, but hidden unless perfumes are reselected.');
    } else {
      setCategoryWarning(null);
    }

    setCategorySlug(newSlug);
    setCategoryName(newCatName);
    setSubCategory('');
    setCustomSubCategory('');

    // Adapt product type default if switching categories
    if (willBeFashion && productType !== 'clothing' && productType !== 'fashion') {
      setProductType('clothing');
      setHasVariants(true);
    } else if (willBePerfume && productType !== 'perfume') {
      setProductType('perfume');
      setHasVariants(true);
    } else if (willBeBook && productType !== 'book' && productType !== 'digital') {
      setProductType('book');
    }
  };

  // Subcategories List based on category
  const availableSubcategories = useMemo(() => {
    if (currentCategoryObj?.subcategories && currentCategoryObj.subcategories.length > 0) {
      return currentCategoryObj.subcategories;
    }
    if (isPerfume) {
      return DEFAULT_PERFUME_SUBCATEGORIES;
    }
    if (isBook) {
      return DEFAULT_BOOK_SUBCATEGORIES;
    }
    if (categorySlug === 'womens-clothing' || categoryName.toLowerCase().includes("women's")) {
      return ['Abayas & Gowns', 'Hijabs & Dupattas', 'Modest Kurtis & Tunics', 'Salwar Suits & Sets', 'Modest Tops & Trousers', "Other Women's Clothing"];
    }
    if (categorySlug === 'mens-clothing' || categoryName.toLowerCase().includes("men's")) {
      return ['Kurtas & Pyjamas', 'Jubbas & Thobes', 'Modest Shirts & Trousers', 'Sherwanis & Waistcoats', 'Caps & Headwear', "Other Men's Clothing"];
    }
    if (categorySlug === 'childrens-clothing' || categoryName.toLowerCase().includes('child')) {
      return ["Boys' Ethnic Wear", "Girls' Modest Wear", "Children's Jubbas & Kurtas", 'School Uniforms', "Other Children's Clothing"];
    }
    if (categorySlug === 'other-fashion-accessories') {
      return ['Prayer Attire & Mats', 'Shawls & Stoles', 'Belts & Brooches', 'Footwear', 'Bags & Pouches', 'Islamic Clothing Accessories'];
    }
    return [];
  }, [currentCategoryObj, isPerfume, isBook, categorySlug, categoryName]);

  // File Upload Handlers (Photograph Gallery)
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setImageUploadError('Invalid format. Please upload a JPEG, PNG, WEBP, or GIF image.');
      return;
    }

    // Validation: File size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageUploadError(`Image file exceeds 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`);
      return;
    }

    setImageUploadError(null);
    setIsUploadingImage(true);
    setImageUploadProgress(15);

    try {
      const res = await uploadStoreProductImage(file, (pct) => setImageUploadProgress(pct));
      const newImgItem: StoreProductImageItem = {
        id: `img-${Date.now()}`,
        url: res.url,
        label: VIEW_TYPE_LABELS[newImageViewType] || 'Front View',
        viewType: newImageViewType,
        isPrimary: !primaryImageUrl && galleryItems.length === 0
      };

      if (!primaryImageUrl) {
        setPrimaryImageUrl(res.url);
      }

      setGalleryItems(prev => [...prev, newImgItem]);
      if (onNotify) onNotify('Product photograph uploaded successfully.', 'success');
    } catch (err: any) {
      console.error('Error uploading product photograph:', err);
      setImageUploadError(err?.message || 'Failed to upload photograph.');
    } finally {
      setIsUploadingImage(false);
      setImageUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setImageUploadError('Please provide a valid URL starting with https:// or http://');
      return;
    }

    setImageUploadError(null);
    const newImgItem: StoreProductImageItem = {
      id: `img-${Date.now()}`,
      url: trimmed,
      label: VIEW_TYPE_LABELS[newImageViewType] || 'Product View',
      viewType: newImageViewType,
      isPrimary: !primaryImageUrl && galleryItems.length === 0
    };

    if (!primaryImageUrl) {
      setPrimaryImageUrl(trimmed);
    }

    setGalleryItems(prev => [...prev, newImgItem]);
    setNewImageUrl('');
  };

  const handleSetPrimaryImage = (targetUrl: string) => {
    setPrimaryImageUrl(targetUrl);
    setGalleryItems(prev =>
      prev.map(item => ({
        ...item,
        isPrimary: item.url === targetUrl
      }))
    );
  };

  const handleRemoveImageItem = (index: number) => {
    const itemToRemove = galleryItems[index];
    const newItems = galleryItems.filter((_, i) => i !== index);
    setGalleryItems(newItems);

    // If removed item was primary, promote next available or clear
    if (primaryImageUrl === itemToRemove?.url) {
      if (newItems.length > 0) {
        setPrimaryImageUrl(newItems[0].url);
        newItems[0].isPrimary = true;
      } else {
        setPrimaryImageUrl('');
      }
    }
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === galleryItems.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...galleryItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setGalleryItems(updated);
  };

  // Upload Digital Product File
  const handleUploadDigitalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDigital(true);
    setDigitalUploadProgress(15);
    try {
      const res = await uploadStoreDigitalFile(file, editingProduct?.id, (pct) => setDigitalUploadProgress(pct));
      setDigitalFileUrl(res.url);
      setDigitalFileName(res.fileName);
      setIsDigital(true);
      if (onNotify) onNotify(`Digital publication file "${res.fileName}" attached successfully.`, 'success');
    } catch (err: any) {
      console.error('Error uploading digital asset:', err);
      setLocalError(err?.message || 'Failed to upload digital file.');
    } finally {
      setIsUploadingDigital(false);
      setDigitalUploadProgress(0);
      if (digitalFileInputRef.current) digitalFileInputRef.current.value = '';
    }
  };

  // Clothing Sizes & Colours Handlers
  const handleAddSize = () => {
    const trimmed = newSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!clothingSizes.includes(trimmed)) {
      setClothingSizes(prev => [...prev, trimmed]);
    }
    setNewSizeInput('');
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setClothingSizes(prev => prev.filter(s => s !== sizeToRemove));
  };

  const handleAddColour = () => {
    const trimmed = newColourInput.trim();
    if (!trimmed) return;
    if (!clothingColours.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setClothingColours(prev => [...prev, trimmed]);
    }
    setNewColourInput('');
  };

  const handleRemoveColour = (colourToRemove: string) => {
    setClothingColours(prev => prev.filter(c => c !== colourToRemove));
  };

  // Generate Matrix of Size and Colour Variants
  const handleGenerateClothingVariants = () => {
    if (clothingSizes.length === 0 || clothingColours.length === 0) {
      setLocalError('Please add at least one size and one colour to generate combinations.');
      return;
    }

    setLocalError(null);
    const baseSkuPrefix = (sku.trim() || generateProductSlug(productName || 'CLO')).toUpperCase().slice(0, 10);
    const newVariants: StoreProductVariant[] = [];

    clothingSizes.forEach(s => {
      clothingColours.forEach(c => {
        const variantId = `var-${s}-${c.replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
        const cleanColour = c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
        const comboSku = `${baseSkuPrefix}-${s}-${cleanColour}`;

        // Look for existing variant to preserve price / stock if already entered
        const existing = variants.find(
          v => (v.attributes?.['Size'] === s || v.attributes?.['size'] === s) &&
               (v.attributes?.['Colour'] === c || v.attributes?.['Color'] === c)
        );

        newVariants.push({
          id: existing?.id || variantId,
          name: `Size: ${s} / Colour: ${c}`,
          sku: existing?.sku || comboSku,
          price: existing?.price ?? (price > 0 ? price : undefined),
          mrp: existing?.mrp ?? (mrp > 0 ? mrp : undefined),
          availability: existing?.availability || 'in_stock',
          isAvailable: existing?.isAvailable ?? true,
          stockCount: existing?.stockCount ?? 10,
          trackInventory: true,
          attributes: {
            'Size': s,
            'Colour': c
          }
        });
      });
    });

    setVariants(newVariants);
    setHasVariants(true);
    if (onNotify) onNotify(`Generated ${newVariants.length} size-and-colour inventory variants.`, 'info');
  };

  // Perfume Bottle Sizes Handlers (Task 30)
  const handleAddBottleSize = () => {
    const trimmed = newBottleSizeInput.trim();
    if (!trimmed) return;
    if (!bottleSizes.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setBottleSizes(prev => [...prev, trimmed]);
    }
    setNewBottleSizeInput('');
  };

  const handleRemoveBottleSize = (sizeToRemove: string) => {
    setBottleSizes(prev => prev.filter(s => s !== sizeToRemove));
  };

  // Generate Bottle-Size Inventory Variants (Task 30)
  const handleGeneratePerfumeVariants = () => {
    if (bottleSizes.length === 0) {
      setLocalError('Please add at least one bottle size to generate fragrance volume variants.');
      return;
    }

    setLocalError(null);
    const baseSkuPrefix = (sku.trim() || generateProductSlug(productName || 'PERFUME')).toUpperCase().slice(0, 10);
    const newVariants: StoreProductVariant[] = [];

    bottleSizes.forEach(size => {
      const cleanSize = size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const comboSku = `${baseSkuPrefix}-${cleanSize}`;
      const variantId = `var-bottle-${cleanSize}-${Date.now().toString().slice(-4)}`;

      // Look for existing variant to preserve price / stock if already entered
      const existing = variants.find(
        v => v.attributes?.['Bottle Size'] === size || v.attributes?.['Size'] === size || v.attributes?.['Volume'] === size
      );

      const variantTitle = fragranceName.trim() ? `${fragranceName.trim()} (${size})` : `${size} Bottle`;

      newVariants.push({
        id: existing?.id || variantId,
        name: existing?.name || variantTitle,
        sku: existing?.sku || comboSku,
        price: existing?.price ?? (price > 0 ? price : undefined),
        mrp: existing?.mrp ?? (mrp > 0 ? mrp : undefined),
        availability: existing?.availability || 'in_stock',
        isAvailable: existing?.isAvailable ?? true,
        stockCount: existing?.stockCount ?? 15,
        trackInventory: true,
        attributes: {
          'Bottle Size': size,
          'Concentration': fragranceConcentration.toUpperCase()
        }
      });
    });

    setVariants(newVariants);
    setHasVariants(true);
    if (onNotify) onNotify(`Generated ${newVariants.length} bottle size inventory variants.`, 'info');
  };

  const handleUpdateVariant = (variantId: string, updates: Partial<StoreProductVariant>) => {
    setVariants(prev =>
      prev.map(v => (v.id === variantId ? { ...v, ...updates } : v))
    );
  };

  const handleRemoveVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
  };

  const handleAddManualVariant = () => {
    const id = `var-manual-${Date.now()}`;
    const newVar: StoreProductVariant = {
      id,
      name: 'Custom Variant',
      sku: `${sku || 'VAR'}-${variants.length + 1}`,
      price: price > 0 ? price : undefined,
      availability: 'in_stock',
      isAvailable: true,
      stockCount: 10,
      trackInventory: true,
      attributes: {}
    };
    setVariants(prev => [...prev, newVar]);
    setHasVariants(true);
  };

  // Related Products Search and Toggle
  const filteredSearchProducts = useMemo(() => {
    if (!relatedSearchQuery.trim()) return [];
    const q = relatedSearchQuery.toLowerCase();
    return allProducts
      .filter(p => p.id !== editingProduct?.id && !relatedProductIds.includes(p.id))
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [allProducts, relatedSearchQuery, editingProduct, relatedProductIds]);

  const selectedRelatedProducts = useMemo(() => {
    return allProducts.filter(p => relatedProductIds.includes(p.id));
  }, [allProducts, relatedProductIds]);

  const handleAddRelatedProduct = (prodId: string) => {
    if (!relatedProductIds.includes(prodId)) {
      setRelatedProductIds(prev => [...prev, prodId]);
      setRelatedSearchQuery('');
    }
  };

  const handleRemoveRelatedProduct = (prodId: string) => {
    setRelatedProductIds(prev => prev.filter(id => id !== prodId));
  };

  // Total stock across variants
  const totalVariantStock = useMemo(() => {
    if (!hasVariants || variants.length === 0) return stockCount;
    return variants.reduce((sum, v) => sum + (v.stockCount ?? 0), 0);
  }, [hasVariants, variants, stockCount]);

  // Product Images Array for backward compatibility
  const computedProductImages = useMemo(() => {
    const list: string[] = [];
    if (primaryImageUrl) list.push(primaryImageUrl);
    galleryItems.forEach(item => {
      if (item.url && !list.includes(item.url)) list.push(item.url);
    });
    return list;
  }, [primaryImageUrl, galleryItems]);

  // Submission Validation
  const validateForm = (isDraft: boolean): boolean => {
    setLocalError(null);

    if (!productName.trim()) {
      setLocalError('Product Title is required.');
      return false;
    }

    if (!categorySlug) {
      setLocalError('Category is required.');
      return false;
    }

    if (price < 0) {
      setLocalError('Price cannot be negative.');
      return false;
    }

    // In Draft mode, allow saving incomplete work
    if (isDraft) return true;

    // Strict validation for Publishing
    if (!description.trim()) {
      setLocalError('Product Description is required before publication.');
      return false;
    }

    if (!primaryImageUrl && galleryItems.length === 0) {
      setLocalError('At least one primary product photograph is required to publish.');
      return false;
    }

    // If Digital Product
    if (isDigitalNature) {
      if (!digitalFileUrl.trim() && !digitalPreviewUrl.trim()) {
        setLocalError('Digital products require an uploaded electronic file (PDF) or direct download URL.');
        return false;
      }
    }

    // If Fashion Product with Variants
    if (isFashion && hasVariants) {
      if (variants.length === 0) {
        setLocalError('Clothing products require at least one size/colour variant before publication.');
        return false;
      }
      const skus = new Set<string>();
      for (const v of variants) {
        if (!v.sku?.trim()) {
          setLocalError(`Variant "${v.name}" is missing a SKU identifier.`);
          return false;
        }
        if (skus.has(v.sku.trim().toUpperCase())) {
          setLocalError(`Duplicate SKU "${v.sku}" found across variants. Each variant combination must have a unique SKU.`);
          return false;
        }
        skus.add(v.sku.trim().toUpperCase());
      }
    }

    // If Perfume Product with Variants (Task 30)
    if (isPerfume && hasVariants) {
      if (variants.length === 0) {
        setLocalError('Perfume products require at least one bottle size variant before publication.');
        return false;
      }
      const skus = new Set<string>();
      for (const v of variants) {
        if (!v.sku?.trim()) {
          setLocalError(`Bottle size variant "${v.name}" is missing a SKU identifier.`);
          return false;
        }
        if (skus.has(v.sku.trim().toUpperCase())) {
          setLocalError(`Duplicate SKU "${v.sku}" found across bottle size variants. Each variant must have a unique SKU.`);
          return false;
        }
        skus.add(v.sku.trim().toUpperCase());
      }
    }

    return true;
  };

  // Handle Save / Publish
  const handleSubmit = async (isDraftMode: boolean) => {
    if (!validateForm(isDraftMode)) return;

    const finalSlug = productSlug.trim() || generateProductSlug(productName);
    const finalSubcat = subCategory === 'custom' ? customSubCategory.trim() : subCategory.trim();
    const effectiveIsDigital = isDigitalNature;

    const finalStatus: StoreProductStatus = isDraftMode ? 'DRAFT' : status;
    const finalIsPublished = isDraftMode ? false : isPublished && finalStatus === 'ACTIVE';

    // Construct Options
    const variantOptionsList: StoreProductOption[] = [];
    if (isFashion && clothingSizes.length > 0) {
      variantOptionsList.push({ name: 'Size', values: clothingSizes });
    }
    if (isFashion && clothingColours.length > 0) {
      variantOptionsList.push({ name: 'Colour', values: clothingColours });
    }
    if (isPerfume && bottleSizes.length > 0) {
      variantOptionsList.push({ name: 'Bottle Size', values: bottleSizes });
    }

    const payload: Partial<StoreProduct> = {
      name: productName.trim(),
      slug: finalSlug,
      description: description.trim(),
      category: categorySlug,
      categoryName: categoryName.trim(),
      subCategory: finalSubcat || undefined,
      productType: isFashion ? 'clothing' : (isPerfume ? 'perfume' : (effectiveIsDigital ? 'digital' : productType)),
      price: Number(price),
      mrp: mrp ? Number(mrp) : undefined,
      availability,
      isAvailable: isAvailable && availability !== 'unavailable' && availability !== 'out_of_stock',
      trackInventory: effectiveIsDigital ? false : trackInventory,
      stockCount: hasVariants ? totalVariantStock : (trackInventory ? Number(stockCount) : 0),
      lowStockThreshold: trackInventory ? Number(lowStockThreshold) : undefined,
      status: finalStatus,
      isActive: finalStatus === 'ACTIVE',
      isArchived: finalStatus === 'ARCHIVED',
      isPublished: finalIsPublished,
      sku: sku.trim(),
      imageUrl: primaryImageUrl || (galleryItems[0]?.url || undefined),
      productImages: computedProductImages.length > 0 ? computedProductImages : undefined,
      galleryItems: galleryItems.length > 0 ? galleryItems : undefined,
      features: features.split(',').map(f => f.trim()).filter(Boolean),
      hasVariants,
      variantOptions: variantOptionsList.length > 0 ? variantOptionsList : undefined,
      variants: hasVariants && variants.length > 0 ? variants : undefined,
      
      // Digital Details
      isDigital: effectiveIsDigital,
      digitalAsset: effectiveIsDigital && (digitalFileUrl.trim() || digitalPreviewUrl.trim())
        ? {
            fileName: digitalFileName.trim() || `${finalSlug}.pdf`,
            fileUrl: digitalFileUrl.trim(),
            accessType: digitalAccessType,
            previewUrl: digitalPreviewUrl.trim() || undefined,
            pageCount: typeof pagesCount === 'number' ? pagesCount : undefined,
            uploadedAt: digitalAsset?.uploadedAt || new Date().toISOString()
          }
        : undefined,
      format: effectiveIsDigital ? (digitalFormat || 'Digital PDF') : (binding || undefined),

      // Book Attributes
      authorOrPublisher: author.trim() || publisher.trim() || undefined,
      publisher: publisher.trim() || undefined,
      isbn: isbn.trim() || undefined,
      edition: edition.trim() || undefined,
      language: language.trim() || undefined,
      binding: binding.trim() || undefined,
      pagesCount: typeof pagesCount === 'number' ? pagesCount : undefined,

      // Clothing Attributes
      brand: (brand.trim() || (isPerfume ? brand.trim() : undefined)) || undefined,
      fabric: fabric.trim() || undefined,
      fit: fit.trim() || undefined,
      style: style.trim() || undefined,
      clothingGender: isFashion ? clothingGender : undefined,

      // Perfumes & Fragrances Attributes (Task 30)
      fragranceName: isPerfume ? (fragranceName.trim() || undefined) : undefined,
      perfumeAudience: isPerfume ? perfumeAudience : undefined,
      fragranceConcentration: isPerfume ? fragranceConcentration : undefined,
      fragranceNotes: isPerfume && (topNotes.trim() || middleNotes.trim() || baseNotes.trim()) ? {
        top: topNotes.trim() || undefined,
        middle: middleNotes.trim() || undefined,
        base: baseNotes.trim() || undefined
      } : undefined,
      fragranceFamily: isPerfume ? (fragranceFamily.trim() || undefined) : undefined,
      countryOfOrigin: isPerfume ? (countryOfOrigin.trim() || undefined) : undefined,
      manufacturer: isPerfume ? (manufacturer.trim() || undefined) : undefined,
      ingredients: isPerfume ? (ingredients.trim() || undefined) : undefined,

      // Product-Level Payment Eligibility (Task 30)
      paymentMethods,

      weightGrams: typeof weightGrams === 'number' ? weightGrams : undefined,
      shippingInfo: !effectiveIsDigital ? {
        weightGrams: typeof weightGrams === 'number' ? weightGrams : undefined,
        estimatedDays: estimatedDays.trim() || undefined,
        freeShipping,
        shippingFee: typeof shippingFee === 'number' ? shippingFee : undefined,
        deliveryNotes: deliveryNotes.trim() || undefined
      } : undefined,

      // Related Products
      relatedProductIds: relatedProductIds.length > 0 ? relatedProductIds : undefined
    };

    await onSave(payload, isDraftMode);
  };

  // Open Live Preview
  const handleOpenPreview = () => {
    setPreviewActiveImage(primaryImageUrl || (galleryItems[0]?.url || ''));
    if (variants.length > 0) {
      setPreviewSelectedVariantId(variants[0].id);
    }
    setIsPreviewModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in my-6">
          
          {/* Modal Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  FET India Store • Smart Upload Dashboard
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>{editingProduct ? 'Edit Catalogue Product' : 'Add New Category-Based Product'}</span>
                  {editingProduct?.isDemo && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Demo Product
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Modal Body: Organized in the 10 Structured Steps */}
          <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto bg-slate-50/50">

            {/* Error or Warning Banners */}
            {(localError || externalError) && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Validation Alert</span>
                  <span>{localError || externalError}</span>
                </div>
              </div>
            )}

            {categoryWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Category Adaptation Note</span>
                  <span className="text-[11px] text-amber-800">{categoryWarning}</span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 1. PRODUCT TYPE SELECTION */}
            {/* ============================================================== */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[11px]">1</span>
                    Product Type
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Defines the delivery model, fulfillment attributes, and customer selection interface.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {[
                  { id: 'clothing', label: 'Physical Clothing', desc: 'Apparel, abayas & fashion', icon: Shirt },
                  { id: 'perfume', label: 'Perfumes & Attars', desc: 'Non-alcoholic scents & EDP', icon: Droplet },
                  { id: 'book', label: 'Books & Literature', desc: 'Textbooks & guides', icon: BookOpen },
                  { id: 'digital', label: 'Digital Publication', desc: 'Downloadable PDF & media', icon: FileText },
                  { id: 'educational_material', label: 'Educational Kits', desc: 'Tools, models & stationery', icon: Package }
                ].map(type => {
                  const Icon = type.icon;
                  const isSelected = isFashion ? type.id === 'clothing' : (isPerfume ? type.id === 'perfume' : (isDigitalNature ? type.id === 'digital' : productType === type.id));
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        if (type.id === 'clothing') {
                          setProductType('clothing');
                          if (!isFashionCategory(categorySlug)) {
                            handleCategoryChange('womens-clothing');
                          }
                          setBookDeliveryNature('physical');
                          setIsDigital(false);
                          setHasVariants(true);
                        } else if (type.id === 'perfume') {
                          setProductType('perfume');
                          if (!isPerfumeCategory(categorySlug)) {
                            handleCategoryChange('perfumes');
                          }
                          setBookDeliveryNature('physical');
                          setIsDigital(false);
                          setHasVariants(true);
                        } else if (type.id === 'digital') {
                          setProductType('digital');
                          setBookDeliveryNature('digital');
                          setIsDigital(true);
                          setTrackInventory(false);
                        } else if (type.id === 'book') {
                          setProductType('book');
                          setBookDeliveryNature('physical');
                          setIsDigital(false);
                          if (!isBookCategory(categorySlug)) {
                            handleCategoryChange('books');
                          }
                        } else {
                          setProductType(type.id as StoreProductType);
                          setIsDigital(false);
                          setBookDeliveryNature('physical');
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />}
                      </div>
                      <div>
                        <span className="text-xs font-black block">{type.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{type.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Requirement 4: Explicit Physical vs Digital Choice for Books */}
              {isBook && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                      Book Delivery Model (Requirement 4)
                    </span>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase">Explicit Selection</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      onClick={() => {
                        setBookDeliveryNature('physical');
                        setIsDigital(false);
                        setProductType('book');
                        setTrackInventory(true);
                      }}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        bookDeliveryNature === 'physical'
                          ? 'bg-white border-indigo-600 ring-1 ring-indigo-600 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block font-bold">Physical Book (Printed)</span>
                        <span className="text-[10px] text-slate-500 font-normal">Paperback/Hardbound shipped to address</span>
                      </div>
                      <input
                        type="radio"
                        name="bookDeliveryNature"
                        checked={bookDeliveryNature === 'physical'}
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                    </label>

                    <label
                      onClick={() => {
                        setBookDeliveryNature('digital');
                        setIsDigital(true);
                        setProductType('digital');
                        setTrackInventory(false);
                      }}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        bookDeliveryNature === 'digital'
                          ? 'bg-white border-purple-600 ring-1 ring-purple-600 text-purple-950 font-bold shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block font-bold">Digital Book (E-Book / PDF)</span>
                        <span className="text-[10px] text-slate-500 font-normal">Instant authorized download or sample</span>
                      </div>
                      <input
                        type="radio"
                        name="bookDeliveryNature"
                        checked={bookDeliveryNature === 'digital'}
                        onChange={() => {}}
                        className="accent-purple-600"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* 2 & 3. MAIN CATEGORY & SUBCATEGORY SELECTION */}
            {/* ============================================================== */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[11px]">2 & 3</span>
                Category & Subcategory Taxonomy
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2. Main Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                    <span>Main Category <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-mono">slug: {categorySlug}</span>
                  </label>
                  <select
                    value={categorySlug}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer shadow-2xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug || c.name}>
                        {c.name} {c.isCore ? '• (Core Department)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Subcategory */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Subcategory
                  </label>
                  {availableSubcategories.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={availableSubcategories.includes(subCategory) ? subCategory : subCategory ? 'custom' : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubCategory(val);
                          if (val !== 'custom') setCustomSubCategory('');
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer shadow-2xs"
                      >
                        <option value="">None / General Collection</option>
                        {availableSubcategories.map((sc, i) => (
                          <option key={i} value={sc}>{sc}</option>
                        ))}
                        <option value="custom">+ Other / Custom Subcategory...</option>
                      </select>

                      {subCategory === 'custom' && (
                        <input
                          type="text"
                          value={customSubCategory}
                          onChange={(e) => setCustomSubCategory(e.target.value)}
                          placeholder="Enter custom subcategory title..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="e.g. Standard Curriculum"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 4. PRODUCT NAME AND DESCRIPTION */}
            {/* ============================================================== */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[11px]">4</span>
                Product Title & Description
              </span>

              {/* Title & Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (!editingProduct) {
                      setProductSlug(generateProductSlug(e.target.value));
                    }
                  }}
                  placeholder={
                    isFashion
                      ? "e.g. Premium Modest Cotton Abaya with Lace Trim"
                      : "e.g. Prescribed National Competition Reader: Ethics in Practice"
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 block">
                    Product URL Slug
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    fetindia.com/store/{productSlug || 'slug'}
                  </span>
                </div>
                <input
                  type="text"
                  value={productSlug}
                  onChange={(e) => setProductSlug(generateProductSlug(e.target.value))}
                  placeholder="e.g. modest-cotton-abaya-black"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isFashion
                      ? "Describe the garment, tailoring quality, stitching details, styling suggestions, modest silhouette, and seasonal suitability..."
                      : "Detailed description of the publication, curriculum scope, study objectives, and academic research relevance..."
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs leading-relaxed"
                />
              </div>

              {/* Key Features */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Key Highlights / Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder={
                    isFashion
                      ? "Breathable Cotton, Modest Fit, Machine Washable, Dual Pocket, Ankle Length"
                      : "Prescribed 2025 Syllabus, 240 Pages, Urdu & English Bilingual, Verified References"
                  }
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            {/* ============================================================== */}
            {/* 5. PRODUCT PHOTOGRAPHS (PROFESSIONAL GALLERY) */}
            {/* ============================================================== */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[11px]">5</span>
                    Professional Product Photograph Gallery ({galleryItems.length + (primaryImageUrl && !galleryItems.some(i => i.url === primaryImageUrl) ? 1 : 0)})
                  </span>
                  <p className="text-[11px] text-slate-500">
                    High-definition photographs with view angles (Front, Back, Side, Detail). Reorder or set primary cover.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadImageFile}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? `Uploading (${imageUploadProgress}%)...` : 'Upload Photo'}</span>
                  </button>
                </div>
              </div>

              {imageUploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{imageUploadError}</span>
                </div>
              )}

              {/* Add by URL with View Angle selector */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  />
                  <select
                    value={newImageViewType}
                    onChange={(e) => setNewImageViewType(e.target.value as StoreImageViewType)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {Object.entries(VIEW_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                >
                  Add Image
                </button>
              </div>

              {/* Gallery Grid: Primary & Additional Views with Reordering */}
              {galleryItems.length === 0 && !primaryImageUrl ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <span className="text-xs font-bold text-slate-600 block">No product photographs added yet</span>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Upload at least one primary product photograph. For fashion items, front, back, and fabric detail views are recommended.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {/* Primary Image Showcase */}
                    {primaryImageUrl && (
                      <div className="p-2 bg-emerald-50/50 border-2 border-emerald-500 rounded-2xl relative space-y-1.5 group shadow-xs">
                        <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center relative">
                          <img
                            src={primaryImageUrl}
                            alt="Primary Cover"
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-current" /> Primary Cover
                          </span>
                          <button
                            type="button"
                            onClick={() => setLightboxImageUrl(primaryImageUrl)}
                            className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 cursor-pointer"
                            title="Preview high-res image"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] px-1 font-bold text-emerald-950">
                          <span>Primary Image</span>
                        </div>
                      </div>
                    )}

                    {/* Additional Gallery Items */}
                    {galleryItems.filter(i => i.url !== primaryImageUrl).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-2 bg-white border border-slate-200 rounded-2xl relative space-y-1.5 group hover:border-slate-300 shadow-2xs"
                      >
                        <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center relative">
                          <img
                            src={item.url}
                            alt={item.label || `Gallery ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[9px] font-bold">
                            {item.label || VIEW_TYPE_LABELS[item.viewType || 'other']}
                          </span>
                          <button
                            type="button"
                            onClick={() => setLightboxImageUrl(item.url)}
                            className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 cursor-pointer"
                            title="Preview high-res image"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Image Actions: Set Primary, Move Left/Right, Delete */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(item.url)}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                            title="Make this the primary cover photograph"
                          >
                            <Star className="w-3 h-3" /> Set Primary
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'up')}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] cursor-pointer"
                              title="Move photo left"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'down')}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] cursor-pointer"
                              title="Move photo right"
                            >
                              →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImageItem(idx)}
                              className="w-5 h-5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] cursor-pointer"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* 6. CATEGORY-SPECIFIC ATTRIBUTES */}
            {/* ============================================================== */}
            
            {/* CASE A: CLOTHING & FASHION PRODUCTS FORM */}
            {isFashion && (
              <div className="p-5 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 border border-rose-200 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Shirt className="w-4 h-4 text-rose-600" />
                      Physical Clothing & Fashion Attributes (Requirement 2)
                    </span>
                    <p className="text-[11px] text-rose-800">
                      Brand, fabric, fit, and configurable size-and-colour inventory matrix.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    Fashion Mode
                  </span>
                </div>

                {/* Brand, Garment Type, Fabric, Fit, Style Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Brand / Label</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. FET Modest Wear"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Fabric / Material</label>
                    <input
                      type="text"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="e.g. 100% Pure Cotton / Nida"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Fit Profile</label>
                    <input
                      type="text"
                      value={fit}
                      onChange={(e) => setFit(e.target.value)}
                      placeholder="e.g. Modest Relaxed Fit"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Style / Occasion</label>
                    <input
                      type="text"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      placeholder="e.g. Daily Casual / Traditional"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Garment Silhouette</label>
                    <input
                      type="text"
                      value={garmentType}
                      onChange={(e) => setGarmentType(e.target.value)}
                      placeholder="e.g. Flared Abaya / Straight Kurta"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Department</label>
                    <select
                      value={clothingGender}
                      onChange={(e) => setClothingGender(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="women">Women's Wear</option>
                      <option value="men">Men's Wear</option>
                      <option value="children">Children's Wear</option>
                      <option value="unisex">Unisex / General</option>
                    </select>
                  </div>
                </div>

                {/* SIZES & COLOURS CONFIGURABLE MANAGERS (Requirement 2: Do not hard-code sizes or colours) */}
                <div className="p-4 bg-white border border-rose-200 rounded-2xl space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900 block">
                      Configurable Sizes & Colours (Administrator Managed)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Add, customize, or remove available sizes and colours without creating separate products.
                    </p>
                  </div>

                  {/* 1. Sizes Manager */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                      <span>Available Sizes ({clothingSizes.length})</span>
                      <span className="text-[10px] text-slate-400">e.g. S, M, L, XL, 38, 40, Free Size</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {clothingSizes.map(s => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 shadow-2xs"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(s)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={newSizeInput}
                          onChange={(e) => setNewSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSize();
                            }
                          }}
                          placeholder="+ Add size..."
                          className="w-24 px-2.5 py-1 bg-white border border-dashed border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddSize}
                          className="px-2 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Colours Manager */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                      <span>Available Colours ({clothingColours.length})</span>
                      <span className="text-[10px] text-slate-400">e.g. Black, Navy Blue, Olive Green, Maroon</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {clothingColours.map(c => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 shadow-2xs"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-300 inline-block" />
                          {c}
                          <button
                            type="button"
                            onClick={() => handleRemoveColour(c)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={newColourInput}
                          onChange={(e) => setNewColourInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddColour();
                            }
                          }}
                          placeholder="+ Add colour..."
                          className="w-28 px-2.5 py-1 bg-white border border-dashed border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddColour}
                          className="px-2 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generate Combinations Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Size & Colour Combination Matrix ({variants.length} items)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Generates a separate SKU, price, and stock quantity for each combination.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateClothingVariants}
                        className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Combinations</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddManualVariant}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        + Manual
                      </button>
                    </div>
                  </div>

                  {/* Configured Variants Matrix Table */}
                  {variants.length > 0 && (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {variants.map((v, vIdx) => (
                        <div
                          key={v.id || vIdx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900">{v.name}</span>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={v.isAvailable !== false && v.availability !== 'unavailable' && v.availability !== 'out_of_stock'}
                                  onChange={(e) => {
                                    const avail = e.target.checked;
                                    handleUpdateVariant(v.id, {
                                      isAvailable: avail,
                                      availability: avail ? 'in_stock' : 'unavailable'
                                    });
                                  }}
                                  className="w-3.5 h-3.5 accent-emerald-600 rounded"
                                />
                                <span>In Stock</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(v.id)}
                                className="text-slate-400 hover:text-rose-600 font-bold px-1 cursor-pointer"
                                title="Remove combination"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block">SKU Identifier</label>
                              <input
                                type="text"
                                value={v.sku || ''}
                                onChange={(e) => handleUpdateVariant(v.id, { sku: e.target.value })}
                                placeholder="SKU"
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block">Price Override (₹)</label>
                              <input
                                type="number"
                                min="0"
                                value={v.price ?? ''}
                                onChange={(e) => handleUpdateVariant(v.id, { price: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder={`Base: ₹${price}`}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block">Stock Units</label>
                              <input
                                type="number"
                                min="0"
                                value={v.stockCount ?? ''}
                                onChange={(e) => handleUpdateVariant(v.id, { stockCount: e.target.value ? Number(e.target.value) : 0 })}
                                placeholder="Units"
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block">Availability</label>
                              <select
                                value={v.availability || 'in_stock'}
                                onChange={(e) => {
                                  const newAvail = e.target.value as StoreProductAvailability;
                                  handleUpdateVariant(v.id, {
                                    availability: newAvail,
                                    isAvailable: newAvail !== 'unavailable' && newAvail !== 'out_of_stock'
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                              >
                                <option value="in_stock">In Stock</option>
                                <option value="pre_order">Pre-Order</option>
                                <option value="out_of_stock">Out of Stock</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CASE B: PHYSICAL BOOKS SPECIFICATIONS */}
            {isBook && !isDigitalNature && (
              <div className="p-5 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border border-indigo-200 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-700" />
                      Physical Book Specifications (Requirement 4)
                    </span>
                    <p className="text-[11px] text-indigo-800">
                      Author, publisher, ISBN, edition, binding, and physical page specifications.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                    Physical Book
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Author / Scholarly Board</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. FET Academic Council"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Publisher</label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="e.g. Fatimyah Educational Trust"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">ISBN (if applicable)</label>
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="e.g. 978-81-900000-0-0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Edition</label>
                    <input
                      type="text"
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      placeholder="e.g. 2025 Revised Edition"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Language</label>
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="e.g. Urdu / English bilingual"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Binding / Format</label>
                    <select
                      value={binding || 'Paperback'}
                      onChange={(e) => setBinding(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="Paperback">Paperback</option>
                      <option value="Hardcover">Hardcover / Hardbound</option>
                      <option value="Spiral Bound">Spiral Bound Workbook</option>
                      <option value="Leatherette">Deluxe Leatherette</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Page Count</label>
                    <input
                      type="number"
                      min="1"
                      value={pagesCount}
                      onChange={(e) => setPagesCount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 240"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASE C: DIGITAL BOOK / DIGITAL PRODUCT SPECIFICATIONS */}
            {isDigitalNature && (
              <div className="p-5 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 border border-purple-200 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-700" />
                      Digital Publication & Electronic File (Requirement 4)
                    </span>
                    <p className="text-[11px] text-purple-800">
                      Secure file asset, access model, digital format, and electronic delivery settings.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                    Digital Product
                  </span>
                </div>

                <input
                  type="file"
                  ref={digitalFileInputRef}
                  onChange={handleUploadDigitalFile}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />

                {/* Upload or Link Electronic Asset */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white border border-purple-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => digitalFileInputRef.current?.click()}
                    disabled={isUploadingDigital}
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingDigital ? `Uploading PDF (${digitalUploadProgress}%)...` : 'Upload PDF Document'}</span>
                  </button>

                  <input
                    type="url"
                    value={digitalFileUrl}
                    onChange={(e) => setDigitalFileUrl(e.target.value)}
                    placeholder="Or authorized digital asset URL (https://...)"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white"
                  />
                </div>

                {digitalFileUrl && (
                  <div className="p-3 bg-white border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-purple-950 truncate">
                        {digitalFileName || 'Attached PDF Publication Document'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDigitalFileUrl('');
                        setDigitalFileName('');
                      }}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Digital Access Model & Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 block">Access Control Model</label>
                    <select
                      value={digitalAccessType}
                      onChange={(e) => setDigitalAccessType(e.target.value as StoreDigitalAccessType)}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-purple-950 cursor-pointer"
                    >
                      <option value="public_download">Public Free Download (Open Syllabus/Reports)</option>
                      <option value="sample_preview">Sample Preview Excerpt (Preview Chapter)</option>
                      <option value="restricted">Restricted Institutional Access (Order Required)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 block">Digital Format</label>
                    <input
                      type="text"
                      value={digitalFormat}
                      onChange={(e) => setDigitalFormat(e.target.value)}
                      placeholder="e.g. PDF / EPUB"
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 block">Sample Excerpt URL (Optional)</label>
                    <input
                      type="url"
                      value={digitalPreviewUrl}
                      onChange={(e) => setDigitalPreviewUrl(e.target.value)}
                      placeholder="Public sample excerpt URL..."
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Author / Board</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. FET Academic Council"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Publisher</label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="FET India"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Language</label>
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="Urdu / English"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Electronic Page Count</label>
                    <input
                      type="number"
                      min="1"
                      value={pagesCount}
                      onChange={(e) => setPagesCount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 180"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASE D: PERFUMES & FRAGRANCES DEDICATED FORM (Task 30) */}
            {isPerfume && !isDigitalNature && (
              <div className="p-5 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/50 border border-amber-200 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-amber-600" />
                      Dedicated Perfumes & Fragrances Form (Task 30)
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Brand, fragrance notes, concentration, target audience, and configurable bottle-size inventory matrix.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Fragrance Mode
                  </span>
                </div>

                {/* Brand, Fragrance Name, Target Audience, Concentration, Family, Origin */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Brand / Fragrance House</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. FET Artisan Attars"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Fragrance Name / Blend</label>
                    <input
                      type="text"
                      value={fragranceName}
                      onChange={(e) => setFragranceName(e.target.value)}
                      placeholder="e.g. Pure Oudh Al-Baqi"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Target Audience</label>
                    <select
                      value={perfumeAudience}
                      onChange={(e) => setPerfumeAudience(e.target.value as 'women' | 'men' | 'unisex')}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="unisex">Unisex (All Audiences)</option>
                      <option value="women">Women's Perfumes</option>
                      <option value="men">Men's Perfumes</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Fragrance Concentration</label>
                    <select
                      value={fragranceConcentration}
                      onChange={(e) => setFragranceConcentration(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="attar">Attar / Concentrated Perfume Oil (Alcohol-Free)</option>
                      <option value="edp">Eau de Parfum (EDP)</option>
                      <option value="edt">Eau de Toilette (EDT)</option>
                      <option value="parfum">Parfum / Extrait de Parfum</option>
                      <option value="body_mist">Body Mist / Fragrance Spray</option>
                      <option value="cologne">Eau de Cologne (EDC)</option>
                      <option value="gift_set">Perfume Gift Set</option>
                      <option value="other">Other Artisan Formulation</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Fragrance Family</label>
                    <select
                      value={fragranceFamily}
                      onChange={(e) => setFragranceFamily(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="Woody">Woody / Amberwood</option>
                      <option value="Floral">Floral (Rose, Jasmine)</option>
                      <option value="Fresh">Fresh / Clean Aquatic</option>
                      <option value="Oriental">Oriental / Musky / Amber</option>
                      <option value="Citrus">Citrus / Zesty</option>
                      <option value="Spicy">Warm Spicy / Saffron</option>
                      <option value="Gourmand">Gourmand / Sweet Vanilla</option>
                      <option value="Botanical">Botanical / Herbal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Country of Origin</label>
                    <input
                      type="text"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      placeholder="e.g. India (Kannauj / Assam)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Manufacturer / Distiller</label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="e.g. Kannauj Artisan Distillers"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Ingredients & Purity Details</label>
                    <input
                      type="text"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="e.g. 100% alcohol-free essential botanical oils, Sandalwood base, natural resins"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Fragrance Notes (Olfactory Pyramid) */}
                <div className="p-3.5 bg-white border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Olfactory Notes Pyramid (If known)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Customer guidance notes</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-900 block">Top Notes (Opening)</label>
                      <input
                        type="text"
                        value={topNotes}
                        onChange={(e) => setTopNotes(e.target.value)}
                        placeholder="e.g. Bergamot, Saffron, Cardamom"
                        className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-900 block">Heart / Middle Notes</label>
                      <input
                        type="text"
                        value={middleNotes}
                        onChange={(e) => setMiddleNotes(e.target.value)}
                        placeholder="e.g. Taif Rose, Jasmine, Nutmeg"
                        className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-900 block">Base Notes (Long-lasting)</label>
                      <input
                        type="text"
                        value={baseNotes}
                        onChange={(e) => setBaseNotes(e.target.value)}
                        placeholder="e.g. Agarwood (Oudh), Sandalwood, Amber"
                        className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Configurable Bottle Sizes & Inventory Matrix */}
                <div className="pt-2 border-t border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        Configurable Bottle Sizes & Inventory Matrix
                      </span>
                      <p className="text-[10px] text-amber-800">
                        Bottle sizes are configurable (e.g. 10 ml, 30 ml, 50 ml, 100 ml, or custom). Add or remove sizes to generate separate SKU, pricing & stock.
                      </p>
                    </div>
                  </div>

                  {/* Active Bottle Sizes Chips */}
                  <div className="p-3 bg-white border border-amber-200/80 rounded-xl space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">Available Bottle Sizes</label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {bottleSizes.map((size) => (
                        <span
                          key={size}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                        >
                          <span>{size}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBottleSize(size)}
                            className="w-4 h-4 rounded-full hover:bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] cursor-pointer"
                            title="Remove bottle size"
                          >
                            ✕
                          </button>
                        </span>
                      ))}

                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="text"
                          value={newBottleSizeInput}
                          onChange={(e) => setNewBottleSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBottleSize();
                            }
                          }}
                          placeholder="e.g. 6 ml, 12 ml, 25 ml"
                          className="w-36 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleAddBottleSize}
                          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          + Add Size
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleGeneratePerfumeVariants}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate Bottle Size Inventory Matrix ({bottleSizes.length} Sizes)</span>
                    </button>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {variants.length} active variant combinations
                    </span>
                  </div>

                  {/* Bottle Size Variants Table */}
                  {hasVariants && variants.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                        Bottle Size Inventory & SKU Details
                      </span>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {variants.map((v) => (
                          <div
                            key={v.id}
                            className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900">{v.name}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(v.id)}
                                  className="text-rose-600 hover:text-rose-800 text-[10px] font-bold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block">SKU Identifier</label>
                                <input
                                  type="text"
                                  value={v.sku || ''}
                                  onChange={(e) => handleUpdateVariant(v.id, { sku: e.target.value })}
                                  placeholder="SKU"
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block">Price Override (₹)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.price ?? ''}
                                  onChange={(e) => handleUpdateVariant(v.id, { price: e.target.value ? Number(e.target.value) : undefined })}
                                  placeholder={`Base: ₹${price}`}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block">Stock Units</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stockCount ?? ''}
                                  onChange={(e) => handleUpdateVariant(v.id, { stockCount: e.target.value ? Number(e.target.value) : 0 })}
                                  placeholder="Units"
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block">Availability</label>
                                <select
                                  value={v.availability || 'in_stock'}
                                  onChange={(e) => {
                                    const newAvail = e.target.value as StoreProductAvailability;
                                    handleUpdateVariant(v.id, {
                                      availability: newAvail,
                                      isAvailable: newAvail !== 'unavailable' && newAvail !== 'out_of_stock'
                                    });
                                  }}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                                >
                                  <option value="in_stock">In Stock</option>
                                  <option value="pre_order">Pre-Order</option>
                                  <option value="out_of_stock">Out of Stock</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General SKU identifier for items without variants */}
            {((!isFashion && !isPerfume) || !hasVariants) && (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                <label className="text-xs font-bold text-slate-700 block">
                  Product SKU / Stock Keeping Unit
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. FET-BK-2025-01"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            )}

            {/* ============================================================== */}
            {/* 7. PRICE, STOCK, AND AVAILABILITY */}
            {/* ============================================================== */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[11px]">7</span>
                Price, Stock & Availability Governance
              </span>

              {/* Price & MRP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                    <span>Base Charitable Price (INR ₹) <span className="text-rose-500">*</span></span>
                    {isDigitalNature && <span className="text-[10px] text-emerald-600 font-bold">₹0 permitted for free publications</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    MRP / List Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mrp || ''}
                    onChange={(e) => setMrp(Math.max(0, Number(e.target.value)))}
                    placeholder="Optional (shows discount % if greater than price)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Availability & Lifecycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Availability Status</label>
                  <select
                    value={availability}
                    onChange={(e) => {
                      const val = e.target.value as StoreProductAvailability;
                      setAvailability(val);
                      if (val === 'unavailable' || val === 'out_of_stock') {
                        setIsAvailable(false);
                      } else {
                        setIsAvailable(true);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="in_stock">In Stock & Ready for Dispatch</option>
                    <option value="available">Available for Order</option>
                    <option value="pre_order">Pre-Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="unavailable">Currently Unavailable</option>
                    <option value="discontinued">Discontinued Edition</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Catalogue Lifecycle</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StoreProductStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="ACTIVE">Active (Live in Store Catalogue)</option>
                    <option value="INACTIVE">Inactive (Admin Storage)</option>
                    <option value="DRAFT">Draft (Work in Progress)</option>
                    <option value="ARCHIVED">Archived (Soft Deleted)</option>
                  </select>
                </div>
              </div>

              {/* Physical Inventory Tracking (for non-digital items) */}
              {!isDigitalNature && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Track Physical Stock Units</span>
                      <span className="text-[11px] text-slate-500">
                        {hasVariants
                          ? `Combined variant inventory: ${totalVariantStock} units across ${variants.length} combinations.`
                          : 'Uncheck for untracked / unlimited resources.'}
                      </span>
                    </div>
                    {!hasVariants && (
                      <input
                        type="checkbox"
                        checked={trackInventory}
                        onChange={(e) => setTrackInventory(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                    )}
                  </div>

                  {!hasVariants && trackInventory && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">Stock Units</label>
                        <input
                          type="number"
                          min="0"
                          value={stockCount}
                          onChange={(e) => setStockCount(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">Low Stock Alert Threshold</label>
                        <input
                          type="number"
                          min="1"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Requirement 4: Payment Methods for This Product */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <div className="space-y-0.5">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Payment Methods for This Product (Requirement 4)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Specify whether checkout allows Cash on Delivery, instant Online Payment (Razorpay / UPI / Cards), or both.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Both COD and Online Payment (Default) */}
                  <div
                    onClick={() => setPaymentMethods('both')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethods === 'both'
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Default
                      </span>
                      <input
                        type="radio"
                        name="productPaymentMethod"
                        checked={paymentMethods === 'both'}
                        onChange={() => setPaymentMethods('both')}
                        className="accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-black block">Both COD & Online Payment</span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                        Customers can choose either Cash on Delivery or Instant Online Payment (Cards, UPI, Net Banking).
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery Only */}
                  <div
                    onClick={() => setPaymentMethods('cod')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethods === 'cod'
                        ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 text-amber-950 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        Cash Only
                      </span>
                      <input
                        type="radio"
                        name="productPaymentMethod"
                        checked={paymentMethods === 'cod'}
                        onChange={() => setPaymentMethods('cod')}
                        className="accent-amber-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-black block">Cash on Delivery Only (COD)</span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                        Restricted to Cash on Delivery. Online payment gateway is disabled at checkout.
                      </span>
                    </div>
                  </div>

                  {/* Option 3: Online Payment Only */}
                  <div
                    onClick={() => setPaymentMethods('razorpay')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethods === 'razorpay'
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 text-blue-950 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                        Prepaid Only
                      </span>
                      <input
                        type="radio"
                        name="productPaymentMethod"
                        checked={paymentMethods === 'razorpay'}
                        onChange={() => setPaymentMethods('razorpay')}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-black block">Online Payment Only</span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                        Requires prepaid order (Razorpay / UPI / Cards). Cash on Delivery is strictly not permitted.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 8. RELATED & COMPLEMENTARY PRODUCTS */}
            {/* ============================================================== */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[11px]">8</span>
                  Related & Complementary Products (Requirement 6)
                </span>
                <p className="text-[11px] text-slate-500">
                  Search and link existing products (matching accessories, complementary books, study kits). Saved using verified product IDs.
                </p>
              </div>

              {/* Search & Add */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={relatedSearchQuery}
                      onChange={(e) => setRelatedSearchQuery(e.target.value)}
                      placeholder="Search existing products by title, category, or SKU to link..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {relatedSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setRelatedSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search Dropdown Results */}
                {filteredSearchProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {filteredSearchProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleAddRelatedProduct(p.id)}
                        className="p-2.5 hover:bg-emerald-50/70 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-0.5 truncate">
                            <span className="text-xs font-bold text-slate-900 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-500 block">
                              {p.categoryName || p.category} • ₹{p.price}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                          + Link
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Related Products List */}
              {selectedRelatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {selectedRelatedProducts.map(rel => (
                    <div
                      key={rel.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                          {rel.imageUrl ? (
                            <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 block truncate">{rel.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {rel.id.slice(0, 8)}... • ₹{rel.price}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRelatedProduct(rel.id)}
                        className="text-slate-400 hover:text-rose-600 font-bold p-1 cursor-pointer"
                        title="Unlink product"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 block italic">
                  No complementary products linked yet. Search above to add matching items.
                </span>
              )}
            </div>

            {/* ============================================================== */}
            {/* 9. SHIPPING OR DIGITAL-DELIVERY DETAILS */}
            {/* ============================================================== */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[11px]">9</span>
                {isDigitalNature ? 'Digital Delivery & Fulfillment Settings' : 'Shipping & Physical Delivery Details'}
              </span>

              {isDigitalNature ? (
                <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs space-y-2 text-purple-950">
                  <div className="flex items-center gap-2 font-bold">
                    <Download className="w-4 h-4 text-purple-700" />
                    <span>Instant Electronic Delivery</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Electronic publications, PDF textbooks, and curriculum study files are delivered instantly online upon authorization. No physical shipping or courier dispatch is required.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Product Weight (Grams)</label>
                    <input
                      type="number"
                      min="0"
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 450"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Estimated Delivery Days</label>
                    <input
                      type="text"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      placeholder="e.g. 3-5 business days"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Delivery Charge (₹)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        disabled={freeShipping}
                        value={freeShipping ? 0 : (shippingFee ?? '')}
                        onChange={(e) => setShippingFee(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0 for Standard"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold disabled:bg-slate-100"
                      />
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={freeShipping}
                          onChange={(e) => setFreeShipping(e.target.checked)}
                          className="accent-emerald-600 rounded"
                        />
                        <span>Free</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Publication State Toggle */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-950 block">Publish Live to FET India Store</span>
                <span className="text-[11px] text-emerald-800">
                  When enabled, this product immediately becomes visible to public shoppers on the store catalogue.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

          </div>

          {/* ============================================================== */}
          {/* 10. SAVE DRAFT, PREVIEW, AND PUBLISH ACTIONS */}
          {/* ============================================================== */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Save as Draft */}
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Save product as Draft without publishing"
              >
                <span>Save Draft</span>
              </button>

              {/* Live Preview Button */}
              <button
                type="button"
                onClick={handleOpenPreview}
                className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Preview public store experience"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>

              {/* Publish Button */}
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingProduct ? 'Save & Publish' : 'Publish Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* HIGH-RES LIGHTBOX MODAL */}
      {/* ============================================================== */}
      {lightboxImageUrl && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-3xl p-3 border border-slate-800 space-y-2 relative">
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer hover:bg-white/30"
            >
              ✕
            </button>
            <div className="max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
              <img
                src={lightboxImageUrl}
                alt="Enlarged view"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. LIVE PRODUCT PREVIEW MODAL BEFORE PUBLICATION */}
      {/* ============================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in my-6">
            
            {/* Preview Banner Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Live Public Preview • How Shoppers Will See This Item
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-white/70 hover:text-white font-bold cursor-pointer text-sm"
              >
                ✕ Close Preview
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Image Gallery */}
                <div className="space-y-3">
                  <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                    {previewActiveImage ? (
                      <img
                        src={previewActiveImage}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-slate-300" />
                    )}

                    {mrp > price && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-lg text-xs font-black shadow-xs">
                        {Math.round(((mrp - price) / mrp) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {computedProductImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {computedProductImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewActiveImage(img)}
                          className={`w-12 h-12 rounded-xl border-2 overflow-hidden shrink-0 cursor-pointer ${
                            previewActiveImage === img ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 opacity-70'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attributes & Info */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {categoryName}
                    </span>
                    {subCategory && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {subCategory === 'custom' ? customSubCategory : subCategory}
                      </span>
                    )}
                    {isFashion && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        Modest Wear
                      </span>
                    )}
                    {isPerfume && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Fragrance • {fragranceConcentration.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {productName || 'Untitled Product'}
                  </h3>

                  {(brand || fragranceName || author || publisher) && (
                    <p className="text-xs text-slate-500 font-medium">
                      By <strong className="text-slate-800">{brand || author || publisher}</strong>
                      {fragranceName && <span> • <em>{fragranceName}</em></span>}
                    </p>
                  )}

                  {/* Price */}
                  <div className="pt-2 border-t border-slate-100 flex items-baseline gap-2.5">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {mrp > price && (
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Payment Method Badge */}
                  <div className="flex items-center gap-1.5 pt-1 text-xs">
                    <span className="text-slate-500 font-medium">Payment Option:</span>
                    {paymentMethods === 'cod' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Cash on Delivery Only
                      </span>
                    ) : paymentMethods === 'razorpay' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        Prepaid Online Only
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        COD & Online Payment
                      </span>
                    )}
                  </div>

                  {/* Fashion Variant Selectors */}
                  {isFashion && variants.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block">Available Combinations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setPreviewSelectedVariantId(v.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              previewSelectedVariantId === v.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Perfume Bottle Size Variant Selectors */}
                  {isPerfume && variants.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block">Available Bottle Sizes:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setPreviewSelectedVariantId(v.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              previewSelectedVariantId === v.id
                                ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock & Availability */}
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {availability === 'in_stock' ? 'In Stock & Ready' : availability}
                    </span>
                    {sku && <span className="text-[11px] text-slate-400 font-mono block mt-0.5">SKU: {sku}</span>}
                  </div>
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase text-slate-500">Description</h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {description || 'No description provided.'}
                </p>
              </div>

              {/* Linked Related Products Preview */}
              {selectedRelatedProducts.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500">Related Products Showcase</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedRelatedProducts.map(rel => (
                      <div key={rel.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-900 block truncate">{rel.name}</span>
                        <span className="text-[10px] text-slate-500 block">₹{rel.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview & Continue Editing
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
