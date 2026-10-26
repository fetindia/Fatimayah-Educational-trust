/**
 * @license
 * Public Product Detail Page (Task 3: Product Detail & Public Store Experience)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides an official, comprehensive public showcase for every published and active product:
 * - High-res image gallery with interactive thumbnail switcher
 * - Detailed categorization, subcategorization, and product type taxonomy
 * - Subsidized charitable pricing, MRP comparison, and stock availability
 * - Key features, author/publisher attribution, and specifications
 * - Future-ready purchasing action area (enquiry, distribution pipeline, contact desk)
 * - Safe URL synchronization: "fetindia.com/store/<product-slug>"
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Tag,
  Package,
  Building,
  Info,
  ExternalLink,
  ChevronRight,
  BookOpen,
  FileText,
  Phone,
  Mail,
  HelpCircle,
  Sparkles,
  Layers,
  Download,
  Lock,
  Plus,
  Minus,
  Shirt,
  Truck,
  Droplet
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { StoreProduct, StoreProductType, StoreProductAvailability, StoreProductVariant } from '../../types';

interface PublicProductDetailPageProps {
  product: StoreProduct;
  relatedProducts?: StoreProduct[];
  onBackToCatalogue: () => void;
  onSelectProduct: (product: StoreProduct) => void;
  onOpenContact?: () => void;
  onOpenDonate?: () => void;
}

const PRODUCT_TYPE_DETAILS: Record<StoreProductType, { label: string; badgeColor: string; description: string }> = {
  book: {
    label: 'Prescribed Book',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Printed academic textbook, curriculum reader, or ethical literature published or prescribed by FET India.'
  },
  publication: {
    label: 'FET Publication',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Official academic research paper, trust annual report, or theological symposium paper.'
  },
  educational_material: {
    label: 'Educational Material',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    description: 'Classroom study kits, stationery, science teaching models, and scholastic resources.'
  },
  educational_resource: {
    label: 'Educational Resource',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    description: 'Academic guides, competition syllabus compendiums, and classroom reference charts.'
  },
  digital: {
    label: 'Digital Publication',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Downloadable e-book, multimedia lecture notes, and digital study assets.'
  },
  clothing: {
    label: 'Physical Clothing & Wear',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Modest clothing, ethnic kurtas, jubbas, abayas, and daily attire tailored for comfort and dignity.'
  },
  fashion: {
    label: 'Fashion & Modest Apparel',
    badgeColor: 'bg-pink-50 text-pink-800 border-pink-200',
    description: 'Curated fashion wear, prayer clothing, shawls, and modest accessories.'
  },
  perfume: {
    label: 'Perfume & Fragrance',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    description: 'Permitted non-alcoholic perfume, eau de parfum, and concentrated attar oils.'
  },
  fragrance: {
    label: 'Fragrance & Attar',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
    description: 'Natural attar oils and traditional distilled aromatic blends.'
  },
  physical: {
    label: 'Physical Item',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Tangible educational tools, instructional devices, and scholastic items.'
  },
  merchandise: {
    label: 'Trust Merchandise',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    description: 'Trust insignia pins, academic uniforms, modest badges, and commemorative items.'
  },
  other: {
    label: 'Curated Resource',
    badgeColor: 'bg-slate-50 text-slate-800 border-slate-200',
    description: 'Curated educational and modest community resource.'
  }
};

const AVAILABILITY_DETAILS: Record<StoreProductAvailability, { label: string; badgeColor: string; icon: any }> = {
  in_stock: {
    label: 'In Stock & Available',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: CheckCircle2
  },
  available: {
    label: 'Available for Order',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: CheckCircle2
  },
  pre_order: {
    label: 'Available for Pre-Order',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: Clock
  },
  out_of_stock: {
    label: 'Temporarily Out of Stock',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: AlertCircle
  },
  unavailable: {
    label: 'Currently Unavailable',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: AlertCircle
  },
  discontinued: {
    label: 'Discontinued Edition',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: AlertCircle
  }
};

export const PublicProductDetailPage: React.FC<PublicProductDetailPageProps> = ({
  product,
  relatedProducts = [],
  onBackToCatalogue,
  onSelectProduct,
  onOpenContact,
  onOpenDonate
}) => {
  const [activeImage, setActiveImage] = useState<string>(product.imageUrl || '');
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [cartFeedback, setCartFeedback] = useState<{ message: string; success: boolean } | null>(null);

  const { addToCart, canAddToCart, openCartDrawer, isItemInCart, getItemQuantity } = useCart();

  useEffect(() => {
    setActiveImage(product.imageUrl || (product.productImages && product.productImages[0]) || '');
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      const firstAvail = product.variants.find(
        (v) => v.isAvailable !== false && v.availability !== 'unavailable' && v.availability !== 'out_of_stock'
      );
      setSelectedVariantId((firstAvail || product.variants[0]).id);
    } else {
      setSelectedVariantId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product.hasVariants || !product.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0] || null;
  }, [product, selectedVariantId]);

  const handleSelectVariant = (variant: StoreProductVariant) => {
    setSelectedVariantId(variant.id);
    if (variant.imageUrl) {
      setActiveImage(variant.imageUrl);
    }
  };

  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product.imageUrl) list.push(product.imageUrl);
    if (product.galleryItems && Array.isArray(product.galleryItems)) {
      product.galleryItems.forEach((item) => {
        if (item?.url && !list.includes(item.url)) list.push(item.url);
      });
    }
    if (product.productImages && Array.isArray(product.productImages)) {
      product.productImages.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((v) => {
        if (v.imageUrl && !list.includes(v.imageUrl)) list.push(v.imageUrl);
      });
    }
    return list;
  }, [product]);

  const typeConfig = PRODUCT_TYPE_DETAILS[product.productType] || PRODUCT_TYPE_DETAILS.other;

  // Determine effective pricing and SKU
  const displayPrice = selectedVariant?.price !== undefined ? selectedVariant.price : product.price;
  const displayMrp = selectedVariant?.mrp !== undefined ? selectedVariant.mrp : product.mrp;
  const displaySku = selectedVariant?.sku || product.sku;

  // Determine effective availability and stock status
  const effectiveAvailStatus = selectedVariant ? selectedVariant.availability : product.availability;
  const effectiveIsAvail = selectedVariant
    ? (selectedVariant.isAvailable !== false && selectedVariant.availability !== 'unavailable' && selectedVariant.availability !== 'out_of_stock')
    : (product.isAvailable !== false && product.availability !== 'unavailable' && product.availability !== 'out_of_stock');
  const effectiveStock = selectedVariant?.stockCount !== undefined ? selectedVariant.stockCount : product.stockCount;
  const effectiveTrackInventory = selectedVariant?.trackInventory !== undefined 
    ? selectedVariant.trackInventory 
    : (product.trackInventory !== false && product.productType !== 'digital');

  const isExplicitlyUnavailable = !effectiveIsAvail || effectiveAvailStatus === 'unavailable';
  const isOutOfStock = effectiveAvailStatus === 'out_of_stock' || (effectiveTrackInventory && effectiveStock !== undefined && effectiveStock <= 0 && effectiveAvailStatus !== 'pre_order');
  const isPreOrder = effectiveAvailStatus === 'pre_order';
  const isDiscontinued = effectiveAvailStatus === 'discontinued';
  const isLowStock = effectiveTrackInventory && effectiveStock !== undefined && effectiveStock > 0 && effectiveStock <= (product.lowStockThreshold ?? 5);

  const effectiveAvailabilityKey: StoreProductAvailability = isDiscontinued
    ? 'discontinued'
    : isExplicitlyUnavailable
    ? 'unavailable'
    : isOutOfStock
    ? 'out_of_stock'
    : isPreOrder
    ? 'pre_order'
    : 'in_stock';

  const availConfig = AVAILABILITY_DETAILS[effectiveAvailabilityKey] || AVAILABILITY_DETAILS.in_stock;
  const AvailIcon = availConfig.icon;

  const hasDiscount = displayMrp && displayMrp > displayPrice;
  const discountPercent = hasDiscount && displayMrp
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
    : 0;

  // Digital and Book Product Details
  const activeDigitalAsset = selectedVariant?.digitalAsset || product.digitalAsset;
  const isEffectiveDigital = Boolean(
    product.isDigital ||
    selectedVariant?.isDigital ||
    product.productType === 'digital' ||
    activeDigitalAsset
  );
  const effectiveLanguage = selectedVariant?.attributes?.['Language'] || selectedVariant?.attributes?.['language'] || product.language;
  const effectiveEdition = selectedVariant?.attributes?.['Edition'] || selectedVariant?.attributes?.['edition'] || product.edition;
  const effectiveFormat = selectedVariant?.attributes?.['Format'] || selectedVariant?.attributes?.['format'] || (isEffectiveDigital ? 'Digital PDF' : product.format);
  const effectivePages = activeDigitalAsset?.pageCount || product.pagesCount;

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10" id="fet-public-product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Breadcrumbs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <nav className="flex items-center text-xs font-semibold text-slate-500 space-x-2 overflow-x-auto">
            <button
              onClick={onBackToCatalogue}
              className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 text-slate-600 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-500 shrink-0">FET Store</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-600 font-medium shrink-0">
              {product.categoryName || product.category}
            </span>
            {product.subCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="text-emerald-700 font-medium shrink-0">
                  {product.subCategory}
                </span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-900 font-bold truncate max-w-xs">
              {product.name}
            </span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Share product link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? 'Link Copied!' : 'Share Product'}</span>
            </button>
          </div>
        </div>

        {/* Main Product Presentation Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10">
            
            {/* LEFT COLUMN: IMAGERY & GALLERY (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="aspect-4/3 sm:aspect-square bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-inner">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 transition-all duration-300"
                  />
                ) : (
                  <div className="text-center p-8 text-slate-300">
                    <Package className="w-20 h-20 mx-auto mb-2 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400">Official Trust Product</span>
                  </div>
                )}

                {/* Badges Overlay */}
                {hasDiscount && (
                  <span className="absolute top-4 left-4 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-black shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}

                <span className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                  {typeConfig.label}
                </span>
              </div>

              {/* Multi-Image Gallery Thumbnails */}
              {allImages.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Product Gallery ({allImages.length} images)
                  </span>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => {
                      const galleryMatch = product.galleryItems?.find(g => g.url === img);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(img)}
                          className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer relative bg-slate-50 ${
                            activeImage === img
                              ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Gallery view ${idx + 1}`} className="w-full h-full object-contain p-1" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[8px] font-bold text-center py-0.5 truncate px-0.5">
                            {galleryMatch?.label || (img === product.imageUrl ? 'Cover' : `View ${idx + 1}`)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Institutional Assurance Badge */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Official Non-Profit Subsidized Publication</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  All educational books, modest attire, and institutional publications are curated under statutory transparency. Proceeds support grassroots student scholarships across India.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: ATTRIBUTES, PRICING & FUTURE COMMERCE (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Category & Subcategory Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {product.categoryName || product.category}
                  </span>

                  {product.subCategory && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {product.subCategory}
                    </span>
                  )}

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${typeConfig.badgeColor}`}>
                    {typeConfig.label}
                  </span>
                </div>

                {/* Product Title */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Demo / Test Product Notice */}
                {product.isDemo && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-black text-amber-900 uppercase tracking-wider block">
                        Demonstration & Test Catalogue Item
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        This item is clearly designated as a Demo Product / Test Product for FET Store testing, department navigation, and variant option verification. Not an approved commercial transaction item.
                      </p>
                    </div>
                  </div>
                )}

                {/* Author or Publishing Body */}
                {product.authorOrPublisher && (
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Published / Curated by <strong className="text-slate-900 font-bold">{product.authorOrPublisher}</strong>
                  </p>
                )}

                {/* Pricing Block */}
                <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span className="text-base font-semibold text-slate-400 line-through">
                        ₹{displayMrp?.toLocaleString('en-IN')}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black">
                        Save {discountPercent}%
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Subsidized community welfare price • Inclusive of all statutory contributions
                  </span>
                </div>

                {/* Selectable Variants & Options Section */}
                {product.hasVariants && product.variants && product.variants.length > 0 && (
                  <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Select Variation / Edition
                      </span>
                      {selectedVariant && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                          Selected: {selectedVariant.name}
                        </span>
                      )}
                    </div>

                    {/* Option Attribute Pills (if structured options exist) */}
                    {product.variantOptions && product.variantOptions.length > 0 && (
                      <div className="space-y-3 pt-1">
                        {product.variantOptions.map((opt, optIdx) => (
                          <div key={optIdx} className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-700 block">
                              {opt.name}:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {opt.values.map((val, valIdx) => {
                                const isCurrentVal = selectedVariant?.attributes
                                  ? selectedVariant.attributes[opt.name] === val
                                  : selectedVariant?.name.includes(val);

                                const matchingVar = product.variants?.find((v) =>
                                  v.attributes ? v.attributes[opt.name] === val : v.name.includes(val)
                                );

                                const isMatchAvailable = matchingVar
                                  ? matchingVar.isAvailable !== false && matchingVar.availability !== 'unavailable' && matchingVar.availability !== 'out_of_stock'
                                  : true;

                                return (
                                  <button
                                    key={valIdx}
                                    type="button"
                                    onClick={() => {
                                      if (matchingVar) {
                                        handleSelectVariant(matchingVar);
                                      }
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                      isCurrentVal
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                                        : isMatchAvailable
                                        ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                                        : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                                    }`}
                                  >
                                    <span>{val}</span>
                                    {!isMatchAvailable && (
                                      <span className="ml-1 text-[10px] font-normal no-underline">
                                        (Unavailable)
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Direct Variant Cards List */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        All Available Formats & Variations:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.variants.map((v) => {
                          const isSelected = selectedVariant?.id === v.id;
                          const isAvail = v.isAvailable !== false && v.availability !== 'unavailable' && v.availability !== 'out_of_stock';

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleSelectVariant(v)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-indigo-50/70 border-indigo-600 shadow-2xs ring-1 ring-indigo-600'
                                  : isAvail
                                  ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                  : 'bg-slate-50 border-slate-200 opacity-60'
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <span className={`text-xs font-extrabold block truncate ${isSelected ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                                  {v.name}
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {v.price ? `₹${v.price.toLocaleString('en-IN')}` : `₹${product.price.toLocaleString('en-IN')}`}
                                  {v.sku && ` • ${v.sku}`}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {isAvail ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    {v.availability === 'pre_order' ? 'Pre-Order' : 'Available'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Availability & SKU Status */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${availConfig.badgeColor}`}>
                    <AvailIcon className="w-3.5 h-3.5" />
                    <span>{availConfig.label}</span>
                  </span>

                  {!effectiveTrackInventory || product.productType === 'digital' ? (
                    <span className="text-xs text-slate-500 font-medium">
                      Availability: <strong className="text-emerald-700 font-bold">{product.productType === 'digital' ? 'Digital Edition • Instant Access' : 'Unlimited Stock'}</strong>
                    </span>
                  ) : effectiveStock !== undefined && effectiveStock > 0 ? (
                    <span className="text-xs text-slate-500 font-medium">
                      Stock: <strong className="text-slate-800">{effectiveStock}</strong> available units
                    </span>
                  ) : (
                    <span className="text-xs text-rose-600 font-bold">
                      Stock: Out of Stock
                    </span>
                  )}

                  {displaySku && (
                    <span className="text-xs text-slate-400 font-mono">
                      SKU: <strong className="text-slate-700">{displaySku}</strong>
                    </span>
                  )}
                </div>

                {/* Product-Level Payment Eligibility Badge */}
                {product.paymentMethods && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold pt-1">
                    <span className="text-slate-500 font-medium">Payment Option:</span>
                    {product.paymentMethods === 'cod' ? (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
                        Cash on Delivery Only
                      </span>
                    ) : product.paymentMethods === 'razorpay' ? (
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-[11px] font-bold">
                        Prepaid Only (Razorpay)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
                        COD & Online Payment Supported
                      </span>
                    )}
                  </div>
                )}

                {/* Unavailable Notification Banner */}
                {(isExplicitlyUnavailable || isOutOfStock) && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{isOutOfStock ? 'Temporarily Out of Stock' : 'Currently Unavailable for Order'}</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      {selectedVariant
                        ? `The selected variation "${selectedVariant.name}" is currently unavailable or out of stock. You can browse other available editions or formats above.`
                        : 'This item is currently unavailable for order or dispatch. It remains visible in the official FET Store catalogue for syllabus reference and educational planning.'}
                    </p>
                  </div>
                )}

                {/* Low Stock Warning */}
                {isLowStock && !isExplicitlyUnavailable && !isOutOfStock && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Limited Quantity Remaining: Only <strong>{effectiveStock}</strong> unit{effectiveStock === 1 ? '' : 's'} available in current inventory.</span>
                  </div>
                )}

                {/* ============================================================== */}
                {/* OFFICIAL COMMERCE FOUNDATION: ADD TO CART ACTION PANEL */}
                {/* ============================================================== */}
                {(() => {
                  const validation = canAddToCart(product, selectedVariant);
                  const isPurchasable = validation.isValid;
                  const itemInCart = isItemInCart(product.id, selectedVariant?.id);
                  const inCartQty = getItemQuantity(product.id, selectedVariant?.id);
                  const maxAllowed = (!effectiveTrackInventory || isPreOrder || effectiveStock === undefined) ? 99 : Math.max(1, effectiveStock);

                  const handleAdd = () => {
                    const res = addToCart(product, selectedVariant, purchaseQuantity);
                    setCartFeedback({ message: res.message, success: res.success });
                    setTimeout(() => setCartFeedback(null), 4000);
                  };

                  return (
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-md space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-white block">Order Allocation & Cart</span>
                            <span className="text-[11px] text-slate-400">
                              {isPurchasable ? 'Ready to add to your FET Store Cart' : (validation.reason || 'Not currently available for order')}
                            </span>
                          </div>
                        </div>

                        {itemInCart && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> In Cart ({inCartQty})
                          </span>
                        )}
                      </div>

                      {/* Feedback Banner */}
                      {cartFeedback && (
                        <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                          cartFeedback.success ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200' : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                        }`}>
                          {cartFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                          <span className="text-[11px] font-bold">{cartFeedback.message}</span>
                        </div>
                      )}

                      {isPurchasable ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                          {/* Quantity Selector */}
                          <div className="flex items-center justify-between bg-slate-800/80 rounded-xl p-1 border border-slate-700/80 sm:w-36 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPurchaseQuantity(prev => Math.max(1, prev - 1))}
                              disabled={purchaseQuantity <= 1}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-white text-center w-8">
                              {purchaseQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPurchaseQuantity(prev => Math.min(maxAllowed, prev + 1))}
                              disabled={purchaseQuantity >= maxAllowed}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              title="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Add to Cart Primary Button */}
                          <button
                            type="button"
                            onClick={handleAdd}
                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Add {purchaseQuantity > 1 ? `${purchaseQuantity} to Cart` : 'to Cart'}</span>
                            <span className="text-emerald-200 font-mono font-bold ml-1">
                              • ₹{((displayPrice || 0) * purchaseQuantity).toLocaleString('en-IN')}
                            </span>
                          </button>

                          {/* Open Cart Drawer Button */}
                          {itemInCart && (
                            <button
                              type="button"
                              onClick={openCartDrawer}
                              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                              title="View Cart Drawer"
                            >
                              View Cart
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-[11px] leading-relaxed">
                            {validation.reason || 'This item is currently for catalogue reference only and cannot be ordered online.'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Book & Publication Specifications */}
                {(product.productType === 'book' || product.productType === 'publication' || effectiveLanguage || effectiveEdition || effectiveFormat || effectivePages) && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Book & Publication Specifications
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Language</span>
                        <span className="font-bold text-slate-800">{effectiveLanguage || 'Standard (Urdu / English)'}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Edition</span>
                        <span className="font-bold text-slate-800">{effectiveEdition || 'Standard Edition'}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Format</span>
                        <span className="font-bold text-slate-800">{effectiveFormat || (isEffectiveDigital ? 'Digital PDF' : 'Printed Book')}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pages</span>
                        <span className="font-bold text-slate-800">{effectivePages ? `${effectivePages} Pages` : 'Standard Volume'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fashion & Clothing Specifications */}
                {(product.productType === 'clothing' || product.productType === 'fashion' || product.brand || product.fabric || product.fit || product.style || product.clothingGender) && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-indigo-600" />
                      Fashion & Apparel Specifications
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {product.brand && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Brand</span>
                          <span className="font-bold text-slate-800">{product.brand}</span>
                        </div>
                      )}
                      {product.fabric && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Fabric / Material</span>
                          <span className="font-bold text-slate-800">{product.fabric}</span>
                        </div>
                      )}
                      {product.fit && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Fit</span>
                          <span className="font-bold text-slate-800">{product.fit}</span>
                        </div>
                      )}
                      {product.style && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Style</span>
                          <span className="font-bold text-slate-800">{product.style}</span>
                        </div>
                      )}
                      {product.clothingGender && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Department</span>
                          <span className="font-bold text-slate-800 capitalize">{product.clothingGender}'s Wear</span>
                        </div>
                      )}
                      {(product.weightGrams || product.shippingInfo?.weightGrams) && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Weight</span>
                          <span className="font-bold text-slate-800">{product.weightGrams || product.shippingInfo?.weightGrams}g</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Perfume & Fragrance Specifications (Task 30) */}
                {(product.productType === 'perfume' || product.productType === 'fragrance' || product.fragranceName || product.fragranceConcentration || product.fragranceNotes || product.fragranceFamily) && (
                  <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-amber-600" />
                      Fragrance & Olfactory Specifications
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {product.brand && (
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                          <span className="text-[10px] text-amber-900/60 font-bold block uppercase tracking-wider">Brand / House</span>
                          <span className="font-bold text-slate-800">{product.brand}</span>
                        </div>
                      )}
                      {product.fragranceName && (
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                          <span className="text-[10px] text-amber-900/60 font-bold block uppercase tracking-wider">Fragrance</span>
                          <span className="font-bold text-slate-800">{product.fragranceName}</span>
                        </div>
                      )}
                      {product.fragranceConcentration && (
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                          <span className="text-[10px] text-amber-900/60 font-bold block uppercase tracking-wider">Concentration</span>
                          <span className="font-bold text-slate-800 uppercase">{product.fragranceConcentration}</span>
                        </div>
                      )}
                      {product.perfumeAudience && (
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                          <span className="text-[10px] text-amber-900/60 font-bold block uppercase tracking-wider">Audience</span>
                          <span className="font-bold text-slate-800 capitalize">{product.perfumeAudience}</span>
                        </div>
                      )}
                      {product.fragranceFamily && (
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                          <span className="text-[10px] text-amber-900/60 font-bold block uppercase tracking-wider">Family</span>
                          <span className="font-bold text-slate-800">{product.fragranceFamily}</span>
                        </div>
                      )}
                      {product.countryOfOrigin && (
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                          <span className="text-[10px] text-amber-900/60 font-bold block uppercase tracking-wider">Origin</span>
                          <span className="font-bold text-slate-800">{product.countryOfOrigin}</span>
                        </div>
                      )}
                    </div>

                    {/* Olfactory Notes Pyramid */}
                    {product.fragranceNotes && (product.fragranceNotes.top || product.fragranceNotes.middle || product.fragranceNotes.base) && (
                      <div className="p-3 bg-white border border-amber-200/80 rounded-xl space-y-1.5 text-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
                          Olfactory Pyramid Notes
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {product.fragranceNotes.top && (
                            <div className="bg-amber-50/50 p-2 rounded-lg">
                              <span className="text-[10px] text-amber-800 font-bold block">Top Notes</span>
                              <span className="text-slate-800 font-medium">{product.fragranceNotes.top}</span>
                            </div>
                          )}
                          {product.fragranceNotes.middle && (
                            <div className="bg-amber-50/50 p-2 rounded-lg">
                              <span className="text-[10px] text-amber-800 font-bold block">Heart / Middle Notes</span>
                              <span className="text-slate-800 font-medium">{product.fragranceNotes.middle}</span>
                            </div>
                          )}
                          {product.fragranceNotes.base && (
                            <div className="bg-amber-50/50 p-2 rounded-lg">
                              <span className="text-[10px] text-amber-800 font-bold block">Base Notes</span>
                              <span className="text-slate-800 font-medium">{product.fragranceNotes.base}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ingredients / Manufacturer if provided */}
                    {(product.ingredients || product.manufacturer) && (
                      <div className="p-2.5 bg-white border border-amber-200/80 rounded-xl text-[11px] space-y-1 text-slate-600">
                        {product.manufacturer && (
                          <div>
                            <strong className="text-slate-800">Distilled by:</strong> {product.manufacturer}
                          </div>
                        )}
                        {product.ingredients && (
                          <div>
                            <strong className="text-slate-800">Ingredients:</strong> {product.ingredients}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Digital Product & File Asset Access Block */}
                {isEffectiveDigital && (
                  <div className="p-4 sm:p-5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                            Digital Product & E-Publication
                          </h4>
                          <p className="text-[11px] text-purple-700">
                            Electronic syllabus, downloadable PDF or curriculum material
                          </p>
                        </div>
                      </div>

                      {activeDigitalAsset?.accessType === 'public_download' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                          Free Public Download
                        </span>
                      ) : activeDigitalAsset?.accessType === 'sample_preview' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          Sample Preview Excerpt
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-200/70 text-purple-950 border border-purple-300 shrink-0">
                          Institutional Access
                        </span>
                      )}
                    </div>

                    {/* File Information & Action */}
                    {activeDigitalAsset && activeDigitalAsset.fileUrl ? (
                      <div className="p-3 bg-white border border-purple-200/90 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="space-y-0.5 overflow-hidden pr-2">
                            <span className="font-bold text-purple-950 block truncate">
                              {activeDigitalAsset.fileName || 'Curriculum Publication (PDF)'}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              {activeDigitalAsset.fileSize ? (
                                <span>{(activeDigitalAsset.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                              ) : null}
                              {activeDigitalAsset.pageCount ? (
                                <span>• {activeDigitalAsset.pageCount} Pages</span>
                              ) : null}
                              <span>• PDF Document</span>
                            </div>
                          </div>

                          {activeDigitalAsset.accessType === 'public_download' && (
                            <a
                              href={activeDigitalAsset.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={activeDigitalAsset.fileName}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </a>
                          )}

                          {activeDigitalAsset.accessType === 'sample_preview' && (
                            <a
                              href={activeDigitalAsset.previewUrl || activeDigitalAsset.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Read Sample</span>
                            </a>
                          )}
                        </div>

                        {activeDigitalAsset.accessType === 'restricted' && (
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                              This full electronic publication is protected under FET institutional distribution controls. Access is provisioned directly to verified schools, affiliated teachers, and registered students. Digital order access will be released in Series 3.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span className="text-[11px]">
                          Official electronic publication files are provisioned through institutional academic desks. Contact Secretariat for institutional syllabus file deployment.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Description */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Product Description
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>

                {/* Key Features Checklist */}
                {product.features && product.features.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Product Highlights & Specifications
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      {product.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* FUTURE-READY PURCHASING ACTION AREA (Preserving Deferred Checkout) */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl space-y-4 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">
                      Institutional Ordering & Community Distribution
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Online shopping cart and automated payment settlements are scheduled for launch in Series 3. For student textbook allocations, madrasa bulk study packages, or institutional distributions, please contact the FET India Store Secretariat directly.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Store Helpline: <strong className="text-white">+91 91494 14549</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onBackToCatalogue}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Catalogue
                    </button>
                    {onOpenContact && (
                      <button
                        type="button"
                        onClick={onOpenContact}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Enquire with Secretariat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS SHOWCASE */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Related Publications in {product.categoryName || product.category}
                </h3>
                <p className="text-xs text-slate-500">More curated resources from Fatimyah Educational Trust</p>
              </div>
              <button
                onClick={onBackToCatalogue}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectProduct(rel)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-4/3 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                      {rel.imageUrl ? (
                        <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {rel.subCategory || rel.categoryName || rel.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                      {rel.name}
                    </h4>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">₹{rel.price.toLocaleString('en-IN')}</span>
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
                      <span>View</span> <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
