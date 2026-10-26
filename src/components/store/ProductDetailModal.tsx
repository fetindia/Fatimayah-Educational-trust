/**
 * @license
 * Product Detail Modal (FET Store Foundation)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides an official, accessible product showcase for published educational resources,
 * publications, books, and merchandise.
 * Note: Complete checkout and payment processing is deferred to Series 3.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  BookOpen,
  Package,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  ShieldCheck,
  Building,
  Info,
  X,
  ExternalLink,
  Download,
  Lock,
  Layers,
  Plus,
  Shirt,
  Droplet
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { StoreProduct, StoreProductType, StoreProductAvailability } from '../../types';

interface ProductDetailModalProps {
  product: StoreProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onContactDesk?: () => void;
}

const PRODUCT_TYPE_LABELS: Record<StoreProductType, { label: string; badgeColor: string }> = {
  book: { label: 'Prescribed Book', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  publication: { label: 'FET Publication', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200' },
  educational_material: { label: 'Educational Material', badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  educational_resource: { label: 'Educational Resource', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  digital: { label: 'Digital Publication', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  clothing: { label: 'Physical Clothing', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' },
  fashion: { label: 'Modest Fashion & Wear', badgeColor: 'bg-pink-50 text-pink-800 border-pink-200' },
  perfume: { label: 'Perfume & Fragrance', badgeColor: 'bg-amber-50 text-amber-900 border-amber-200' },
  fragrance: { label: 'Fragrance & Attar', badgeColor: 'bg-amber-50 text-amber-900 border-amber-200' },
  physical: { label: 'Physical Item', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  merchandise: { label: 'Trust Merchandise', badgeColor: 'bg-teal-50 text-teal-800 border-teal-200' },
  other: { label: 'Curated Item', badgeColor: 'bg-slate-50 text-slate-800 border-slate-200' }
};

const AVAILABILITY_LABELS: Record<StoreProductAvailability, { label: string; badgeColor: string; icon: any }> = {
  in_stock: { label: 'In Stock', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  available: { label: 'Available', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  pre_order: { label: 'Pre-Order Available', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  out_of_stock: { label: 'Out of Stock', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300', icon: AlertCircle },
  unavailable: { label: 'Currently Unavailable', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300', icon: AlertCircle },
  discontinued: { label: 'Discontinued', badgeColor: 'bg-slate-100 text-slate-600 border-slate-300', icon: AlertCircle }
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onContactDesk
}) => {
  const [activeImage, setActiveImage] = useState<string>(product?.imageUrl || '');
  const { addToCart, canAddToCart, openCartDrawer, isItemInCart, getItemQuantity } = useCart();
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setActiveImage(product.imageUrl || (product.productImages && product.productImages[0]) || '');
    }
  }, [product]);

  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product?.imageUrl) list.push(product.imageUrl);
    if (product?.galleryItems && Array.isArray(product.galleryItems)) {
      product.galleryItems.forEach((item) => {
        if (item?.url && !list.includes(item.url)) list.push(item.url);
      });
    }
    if (product?.productImages) {
      product.productImages.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [product]);

  if (!isOpen || !product) return null;

  const typeConfig = PRODUCT_TYPE_LABELS[product.productType] || PRODUCT_TYPE_LABELS.other;
  const availConfig = AVAILABILITY_LABELS[product.availability] || AVAILABILITY_LABELS.in_stock;
  const AvailIcon = availConfig.icon;

  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercent = hasDiscount && product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Official FET Store
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white line-clamp-1">
                {product.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Visual & Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Product Image Box */}
            <div className="space-y-2">
              <div className="aspect-4/3 sm:aspect-square bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 transition-all"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-300">
                    <Package className="w-16 h-16 mx-auto mb-2 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400">Curated Item</span>
                  </div>
                )}

                {/* Discount Tag */}
                {hasDiscount && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-lg text-xs font-black shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Additional Image Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`w-12 h-12 rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer bg-slate-50 ${
                        activeImage === img ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain p-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Highlights & Price */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.badgeColor}`}>
                    {typeConfig.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {product.categoryName || product.category}
                  </span>
                  {product.hasVariants && product.variants && product.variants.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {product.variants.length} Variations
                    </span>
                  )}
                  {Boolean(product.isDigital || product.productType === 'digital' || product.digitalAsset) && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> E-Publication / Digital
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h2>

                {product.isDemo && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-bold text-[11px] text-amber-900">
                      Demo / Test Product for FET Store UI verification. Not for sale.
                    </span>
                  </div>
                )}

                {product.authorOrPublisher && (
                  <p className="text-xs text-slate-500 font-medium">
                    By <span className="text-slate-800 font-bold">{product.authorOrPublisher}</span>
                  </p>
                )}

                {/* Pricing Block */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        ₹{product.mrp?.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                    Net charitable trust subsidised price
                  </span>
                </div>

                {/* Availability status */}
                <div className="pt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${availConfig.badgeColor}`}>
                    <AvailIcon className="w-3.5 h-3.5" />
                    <span>{availConfig.label}</span>
                  </span>
                  {product.sku && (
                    <span className="text-[11px] text-slate-400 font-mono block mt-1">
                      SKU: {product.sku}
                    </span>
                  )}
                  {product.paymentMethods && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 font-medium">Payment:</span>
                      {product.paymentMethods === 'cod' ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px]">
                          COD Only
                        </span>
                      ) : product.paymentMethods === 'razorpay' ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md font-bold text-[10px]">
                          Prepaid Only
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[10px]">
                          COD & Prepaid
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Quality Badge */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Official Trust Standard:</strong> Prescribed educational publications and modest attire vetted by the FET Academic Research & Welfare Directorate.
                </span>
              </div>
            </div>
          </div>

          {/* Book Specifications */}
          {(product.productType === 'book' || product.productType === 'publication' || product.language || product.edition || product.format || product.pagesCount) && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                Book & Publication Attributes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Language</span>
                  <span className="font-bold text-slate-800">{product.language || 'Urdu / English'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Edition</span>
                  <span className="font-bold text-slate-800">{product.edition || 'Official Edition'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Format</span>
                  <span className="font-bold text-slate-800">{product.format || (product.isDigital ? 'Digital PDF' : 'Printed Book')}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Pages</span>
                  <span className="font-bold text-slate-800">{product.pagesCount || product.digitalAsset?.pageCount || 'Volume'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Fashion & Garment Attributes */}
          {(product.productType === 'clothing' || product.productType === 'fashion' || product.fabric || product.fit || product.style || product.brand) && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-indigo-600" />
                Fashion & Garment Attributes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {product.brand && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Brand</span>
                    <span className="font-bold text-slate-800">{product.brand}</span>
                  </div>
                )}
                {product.fabric && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Fabric / Material</span>
                    <span className="font-bold text-slate-800">{product.fabric}</span>
                  </div>
                )}
                {product.fit && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Fit</span>
                    <span className="font-bold text-slate-800">{product.fit}</span>
                  </div>
                )}
                {product.style && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Style</span>
                    <span className="font-bold text-slate-800">{product.style}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Perfume & Fragrance Attributes (Task 30) */}
          {(product.productType === 'perfume' || product.productType === 'fragrance' || product.fragranceName || product.fragranceConcentration || product.fragranceNotes || product.fragranceFamily) && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-amber-600" />
                Fragrance & Olfactory Attributes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {product.brand && (
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-amber-900/60 font-bold block">Brand</span>
                    <span className="font-bold text-slate-800">{product.brand}</span>
                  </div>
                )}
                {product.fragranceName && (
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-amber-900/60 font-bold block">Fragrance</span>
                    <span className="font-bold text-slate-800">{product.fragranceName}</span>
                  </div>
                )}
                {product.fragranceConcentration && (
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-amber-900/60 font-bold block">Concentration</span>
                    <span className="font-bold text-slate-800 uppercase">{product.fragranceConcentration}</span>
                  </div>
                )}
                {product.fragranceFamily && (
                  <div className="bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-amber-900/60 font-bold block">Family</span>
                    <span className="font-bold text-slate-800">{product.fragranceFamily}</span>
                  </div>
                )}
              </div>

              {product.fragranceNotes && (product.fragranceNotes.top || product.fragranceNotes.middle || product.fragranceNotes.base) && (
                <div className="p-2.5 bg-white border border-amber-200/80 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">Olfactory Notes</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                    {product.fragranceNotes.top && (
                      <div><strong className="text-amber-900">Top:</strong> {product.fragranceNotes.top}</div>
                    )}
                    {product.fragranceNotes.middle && (
                      <div><strong className="text-amber-900">Heart:</strong> {product.fragranceNotes.middle}</div>
                    )}
                    {product.fragranceNotes.base && (
                      <div><strong className="text-amber-900">Base:</strong> {product.fragranceNotes.base}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Digital Product Asset Section */}
          {Boolean(product.isDigital || product.productType === 'digital' || product.digitalAsset) && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                    Digital Product & E-File
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-200/80 text-purple-900 border border-purple-300">
                  {product.digitalAsset?.accessType === 'public_download'
                    ? 'Free Public Download'
                    : product.digitalAsset?.accessType === 'sample_preview'
                    ? 'Sample Excerpt'
                    : 'Institutional Access'}
                </span>
              </div>

              {product.digitalAsset && product.digitalAsset.fileUrl ? (
                <div className="p-2.5 bg-white border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5 overflow-hidden pr-2">
                    <span className="font-bold text-purple-950 block truncate">
                      {product.digitalAsset.fileName || 'Curriculum File (PDF)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {product.digitalAsset.pageCount ? `${product.digitalAsset.pageCount} Pages • ` : ''}PDF Publication
                    </span>
                  </div>

                  {product.digitalAsset.accessType === 'public_download' && (
                    <a
                      href={product.digitalAsset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={product.digitalAsset.fileName}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}

                  {product.digitalAsset.accessType === 'sample_preview' && (
                    <a
                      href={product.digitalAsset.previewUrl || product.digitalAsset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Sample
                    </a>
                  )}

                  {product.digitalAsset.accessType === 'restricted' && (
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3 text-slate-500" /> Protected
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Digital study copies and syllabus documents are issued via authorized institutional access desk.
                </p>
              )}
            </div>
          )}

          {/* Description Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Description & Specifications
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Key Features if available */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Key Features
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Future Action Area for Purchasing (Chapter SRS - Deferred Checkout) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-900 block">
                  Purchasing & Distribution Pipeline
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Full online checkout, payment gateways, and home delivery are scheduled for release in the Series 3 deployment. For bulk orders, student textbook distributions, or institutional allocations, please contact the Trust Secretariat directly.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-medium">
                Helpline: <strong className="text-slate-800">+91 91494 14549</strong>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {/* Add to Cart button when product is purchasable */}
                {(() => {
                  const validation = canAddToCart(product, null);
                  const isPurchasable = validation.isValid && !product.hasVariants;
                  const itemInCart = isItemInCart(product.id);

                  if (isPurchasable) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const res = addToCart(product, null, 1);
                          setAddedNotice(res.message);
                          setTimeout(() => setAddedNotice(null), 3000);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{itemInCart ? `In Cart (${getItemQuantity(product.id)}) +` : 'Add to Cart'}</span>
                      </button>
                    );
                  }
                  return null;
                })()}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onContactDesk) onContactDesk();
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Enquire with Secretariat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
