/**
 * @license
 * FET Store Public Landing, Department Portals & Catalogue Page (Task 8: Department Architecture)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Architecture:
 * 1. Permanent Main Store Catalogue (/store) with search, filters, featured items, and department directory.
 * 2. Dedicated Department Pages:
 *    - /store/islamic-wear
 *    - /store/perfumes
 *    - /store/educational-materials
 *    - /store/fet-publications
 *    - /store/books
 * 3. Expandable future department structures (Digital Resources, Merchandise).
 * 4. Realistic testing with clearly marked Demo / Test Products.
 * 5. Transparent Educational & Welfare connections to grassroots scholarships and student support.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  BookOpen,
  Search,
  Filter,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Eye,
  Tag,
  Building,
  Shirt,
  GraduationCap,
  FileText,
  Laptop,
  HeartHandshake,
  Layers,
  Award,
  Check,
  Compass
} from 'lucide-react';
import { StoreProduct, StoreCategory, StoreProductType, StoreProductAvailability } from '../../types';
import { subscribeToStoreProducts, subscribeToStoreCategories } from '../../lib/firebase';
import { 
  STORE_DEPARTMENTS, 
  StoreDepartmentInfo, 
  getDepartmentBySlug, 
  normalizeDepartmentSlug,
  CORE_STORE_CATEGORIES 
} from '../../data/storeCategories';
import { STORE_DEMO_PRODUCTS } from '../../data/storeDemoProducts';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProductDetailModal } from './ProductDetailModal';
import { PublicProductDetailPage } from './PublicProductDetailPage';
import { MemberStoreOrdersView } from '../dashboard/MemberStoreOrdersView';

interface FETStorePageProps {
  initialProductSlug?: string;
  onReturnToHome: () => void;
  onOpenAuth?: () => void;
  onOpenDonate?: () => void;
  onOpenContact?: () => void;
  onOpenAdminConsole?: () => void;
}

const TYPE_FILTER_OPTIONS: { id: string; label: string; type?: StoreProductType }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'book', label: 'Books', type: 'book' },
  { id: 'clothing', label: 'Clothing & Fashion', type: 'clothing' },
  { id: 'perfume', label: 'Perfumes & Fragrances', type: 'perfume' },
  { id: 'publication', label: 'FET Publications', type: 'publication' },
  { id: 'educational_material', label: 'Educational Materials', type: 'educational_material' },
  { id: 'digital', label: 'Digital Resources', type: 'digital' },
  { id: 'merchandise', label: 'Merchandise', type: 'merchandise' }
];

export const FETStorePage: React.FC<FETStorePageProps> = ({
  initialProductSlug,
  onReturnToHome,
  onOpenAuth,
  onOpenDonate,
  onOpenContact,
  onOpenAdminConsole
}) => {
  const [liveProducts, setLiveProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Department State (/store vs /store/:dept)
  const [activeDepartment, setActiveDepartment] = useState<StoreDepartmentInfo | null>(() => {
    if (initialProductSlug) {
      const matchedDept = getDepartmentBySlug(initialProductSlug);
      if (matchedDept) return matchedDept;
    }
    return null;
  });

  const { currentUser } = useAuth();
  const [isOrderHistoryActive, setIsOrderHistoryActive] = useState<boolean>(() => {
    return initialProductSlug === 'orders' || initialProductSlug === 'my-orders';
  });

  // Dedicated Product Detail View State
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'unavailable' | 'pre_order'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  const { cart, addToCart, canAddToCart, openCartDrawer, isItemInCart, getItemQuantity } = useCart();

  // Real-time Firestore subscription
  useEffect(() => {
    setIsLoading(true);
    const unsubProducts = subscribeToStoreProducts(
      (list) => {
        setLiveProducts(list);
        setIsLoading(false);
      },
      { publishedOnly: true }
    );

    const unsubCategories = subscribeToStoreCategories((cats) => {
      setCategories(cats);
    }, true);

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  // Combined Catalog: Live Firestore products + Clearly Labelled Demo Products for realistic testing
  const allCatalogProducts = useMemo(() => {
    const map = new Map<string, StoreProduct>();
    // Pre-populate with realistic demo products for each active department
    for (const demo of STORE_DEMO_PRODUCTS) {
      map.set(demo.id, demo);
    }
    // Overlay real published products from Firestore
    for (const prod of liveProducts) {
      map.set(prod.id, prod);
    }
    return Array.from(map.values());
  }, [liveProducts]);

  // Deep-Linking & History Parser
  useEffect(() => {
    if (!initialProductSlug) {
      setActiveDepartment(null);
      setSelectedProduct(null);
      return;
    }

    // Check if initial slug is a department
    const deptMatch = getDepartmentBySlug(initialProductSlug);
    if (deptMatch) {
      setActiveDepartment(deptMatch);
      setSelectedProduct(null);
      return;
    }

    // Check if initial slug is a product
    const productMatch = allCatalogProducts.find(
      (p) =>
        (p.slug === initialProductSlug || p.id === initialProductSlug) &&
        p.isPublished &&
        p.status !== 'INACTIVE' &&
        p.status !== 'ARCHIVED' &&
        p.isActive !== false &&
        !p.isArchived
    );

    if (productMatch) {
      setSelectedProduct(productMatch);
      // Auto-assign active department if matching
      const deptForProduct = STORE_DEPARTMENTS.find(d => d.categoryKey === productMatch.category);
      if (deptForProduct) {
        setActiveDepartment(deptForProduct);
      }
    }
  }, [initialProductSlug, allCatalogProducts]);

  // Handle Browser Back / Forward Button Navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/store' || path === '/store/' || !path.includes('/store/')) {
        setActiveDepartment(null);
        setSelectedProduct(null);
        return;
      }

      if (path.startsWith('/store/')) {
        const slug = decodeURIComponent(path.replace(/^\/store\/?/i, '')).split('?')[0].split('#')[0].trim();
        if (slug) {
          // Check if slug is department
          const dept = getDepartmentBySlug(slug);
          if (dept) {
            setActiveDepartment(dept);
            setSelectedProduct(null);
            return;
          }

          // Check if slug is product
          const prodMatch = allCatalogProducts.find(
            (p) =>
              (p.slug === slug || p.id === slug) &&
              p.isPublished &&
              p.status !== 'INACTIVE' &&
              p.isActive !== false
          );
          if (prodMatch) {
            setSelectedProduct(prodMatch);
            return;
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allCatalogProducts]);

  // Department Selection Handler
  const handleSelectDepartment = (dept: StoreDepartmentInfo | null) => {
    setActiveDepartment(dept);
    setSelectedSubCategory('all');
    setSearchTerm('');
    setSelectedProduct(null);
    setIsOrderHistoryActive(false);

    if (dept) {
      window.history.pushState(null, '', `/store/${dept.slug}`);
    } else {
      window.history.pushState(null, '', '/store');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Product Selection Handler
  const handleSelectProduct = (product: StoreProduct) => {
    setSelectedProduct(product);
    setIsOrderHistoryActive(false);
    const targetSlug = product.slug || product.id;
    window.history.pushState(null, '', `/store/${targetSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to Department or Catalogue
  const handleBackFromProduct = () => {
    setSelectedProduct(null);
    setIsOrderHistoryActive(false);
    if (activeDepartment) {
      window.history.pushState(null, '', `/store/${activeDepartment.slug}`);
    } else {
      window.history.pushState(null, '', '/store');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter products based on active department & filters
  const filteredProducts = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      // Visibility rule
      if (!p.isPublished) return false;
      if (p.status === 'INACTIVE' || p.status === 'ARCHIVED' || p.status === 'DRAFT' || p.isActive === false || p.isArchived === true) {
        return false;
      }

      // Department filter
      if (activeDepartment) {
        const matchesCategory = p.category === activeDepartment.categoryKey ||
          p.category === activeDepartment.id ||
          p.categoryName?.toLowerCase() === activeDepartment.title.toLowerCase();
        if (!matchesCategory) return false;
      }

      // Subcategory filter
      if (selectedSubCategory !== 'all' && p.subCategory !== selectedSubCategory) {
        return false;
      }

      // Product type filter
      if (selectedType !== 'all' && p.productType !== selectedType) {
        return false;
      }

      // Availability filter
      if (selectedAvailability !== 'all') {
        const isAvail = p.isAvailable !== false && p.availability !== 'unavailable' && p.availability !== 'out_of_stock' && !(p.trackInventory !== false && p.stockCount !== undefined && p.stockCount <= 0 && p.availability !== 'pre_order');
        if (selectedAvailability === 'available' && !isAvail) return false;
        if (selectedAvailability === 'unavailable' && isAvail) return false;
        if (selectedAvailability === 'pre_order' && p.availability !== 'pre_order') return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesAuthor = p.authorOrPublisher?.toLowerCase().includes(query);
        const matchesCategory = p.categoryName?.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
        const matchesSubcat = p.subCategory?.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query);
        const matchesFeatures = p.features?.some((f) => f.toLowerCase().includes(query));

        return matchesName || matchesDesc || matchesAuthor || matchesCategory || matchesSubcat || matchesSku || matchesFeatures;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      // Demo items stay prominent for testing if same date
      if (a.isDemo && !b.isDemo) return -1;
      if (!a.isDemo && b.isDemo) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allCatalogProducts, activeDepartment, selectedSubCategory, selectedType, selectedAvailability, searchTerm, sortBy]);

  // Department Icon Renderer
  const renderDeptIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Shirt':
        return <Shirt className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Laptop':
        return <Laptop className={className} />;
      default:
        return <Package className={className} />;
    }
  };

  // Render dedicated Public Product Detail Page if selected
  if (selectedProduct) {
    let related: StoreProduct[] = [];
    if (selectedProduct.relatedProductIds && selectedProduct.relatedProductIds.length > 0) {
      related = allCatalogProducts.filter(
        (p) =>
          selectedProduct.relatedProductIds?.includes(p.id) &&
          p.id !== selectedProduct.id &&
          p.isPublished &&
          p.isActive !== false &&
          !p.isArchived
      );
    }
    if (related.length === 0) {
      related = allCatalogProducts.filter(
        (p) =>
          p.id !== selectedProduct.id &&
          p.isPublished &&
          p.isActive !== false &&
          !p.isArchived &&
          (p.category === selectedProduct.category || p.categoryName === selectedProduct.categoryName)
      );
    }

    return (
      <PublicProductDetailPage
        product={selectedProduct}
        relatedProducts={related}
        onBackToCatalogue={handleBackFromProduct}
        onSelectProduct={handleSelectProduct}
        onOpenContact={onOpenContact}
        onOpenDonate={onOpenDonate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" id="fet-store-public-page">
      {/* ============================================================== */}
      {/* 1. BREADCRUMBS NAVIGATION */}
      {/* ============================================================== */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <nav className="flex items-center text-xs font-semibold text-slate-500 space-x-2">
            <button
              onClick={onReturnToHome}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => {
                setIsOrderHistoryActive(false);
                handleSelectDepartment(null);
              }}
              className={`hover:text-emerald-700 transition-colors cursor-pointer ${
                !activeDepartment && !isOrderHistoryActive ? 'text-slate-900 font-bold' : ''
              }`}
            >
              FET Store
            </button>

            {isOrderHistoryActive && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>My Orders</span>
                </span>
              </>
            )}

            {!isOrderHistoryActive && activeDepartment && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold flex items-center gap-1.5">
                  {renderDeptIcon(activeDepartment.iconName, 'w-3.5 h-3.5 text-emerald-600')}
                  <span>{activeDepartment.title}</span>
                </span>
              </>
            )}

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ml-2">
              Official Store
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!currentUser) {
                  if (onOpenAuth) onOpenAuth();
                } else {
                  setIsOrderHistoryActive((prev) => !prev);
                  setSelectedProduct(null);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isOrderHistoryActive
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                  : 'border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900'
              }`}
              title="View Your Store Orders"
            >
              <Package className="w-3.5 h-3.5" />
              <span>My Orders</span>
            </button>

            <button
              onClick={openCartDrawer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 transition-all text-xs font-bold cursor-pointer"
              title="View Shopping Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Cart</span>
              {cart.totalItems > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                  {cart.totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Rendering: In-Store Order History vs Catalogue (Store Task 16) */}
      {isOrderHistoryActive ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setIsOrderHistoryActive(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store Catalogue</span>
            </button>
          </div>
          <MemberStoreOrdersView
            onOpenStore={() => setIsOrderHistoryActive(false)}
            onOpenAuth={onOpenAuth}
            standaloneInStore={true}
          />
        </div>
      ) : (
        <>

      {/* ============================================================== */}
      {/* 2. HERO / DEPARTMENT BANNER */}
      {/* ============================================================== */}
      {!activeDepartment ? (
        // MAIN CATALOGUE HERO
        <section className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10 backdrop-blur-xs">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Official FET Store Catalogue</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                Educational Publications & Modest Store
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Curated prescribed textbooks, academic research publications, laboratory materials, traditional attars, and dignified modest wear produced and subsidized under the auspices of Fatimyah Educational Trust India.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs text-xs space-y-1">
                <span className="text-emerald-300 font-bold block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Educational & Welfare Connected
                </span>
                <p className="text-[11px] text-slate-300">
                  Subsidized educational distributions support grassroots scholarships and rural student welfare across India.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        // DEDICATED DEPARTMENT HEADER
        <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm border-b border-emerald-900/30">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    {renderDeptIcon(activeDepartment.iconName, 'w-3.5 h-3.5')}
                    <span>{activeDepartment.badge}</span>
                  </span>
                  <span className="text-xs text-slate-400">Department Code: <strong className="text-white font-mono">{activeDepartment.slug}</strong></span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  <span>{activeDepartment.title}</span>
                </h1>

                <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
                  {activeDepartment.tagline}
                </p>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeDepartment.shortDescription}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectDepartment(null)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Store Departments</span>
                </button>
              </div>
            </div>

            {/* Department Welfare Note */}
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-100">
              <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Educational & Welfare Initiative:</strong>{' '}
                <span className="text-emerald-200/90">{activeDepartment.educationalWelfareNote}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN CONTENT CONTAINER */}
      {/* ============================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* DEPARTMENT NAVIGATION GRID (Shown on Main Page or as Department Switcher) */}
        {!activeDepartment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-700" />
                  <span>Browse by Store Department</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select a specialized department to explore dedicated categories, subcategories, and test items.
                </p>
              </div>
            </div>

            {/* Department Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {STORE_DEPARTMENTS.map((dept) => {
                const isCurrent = activeDepartment?.id === dept.id;
                return (
                  <div
                    key={dept.id}
                    onClick={() => handleSelectDepartment(dept)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      dept.isActive
                        ? 'bg-white border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-400'
                        : 'bg-slate-50/70 border-dashed border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          dept.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {renderDeptIcon(dept.iconName, 'w-4 h-4')}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          dept.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {dept.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {dept.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {dept.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400 font-medium">
                        {dept.subcategories.length} Subcategories
                      </span>
                      <span className="text-emerald-700 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        <span>Enter</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEARCH, FILTER & SUBCATEGORY BAR */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeDepartment
                    ? `Search in ${activeDepartment.title} (items, authors, SKUs)...`
                    : 'Search publications, textbooks, modest wear, attars, or categories...'
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Availability Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Availability:</span>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Unavailable Only</option>
                <option value="pre_order">Pre-Order</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="newest">Newest / Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Department Subcategory Selector */}
          {activeDepartment ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-bold shrink-0 mr-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Subcategories:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedSubCategory === 'all'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                All {activeDepartment.title.replace(' Department', '')}
              </button>
              {activeDepartment.subcategories.map((subcat) => (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => setSelectedSubCategory(subcat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    selectedSubCategory === subcat
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {subcat}
                </button>
              ))}
            </div>
          ) : (
            /* Main Catalogue Product Type Filter */
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs text-slate-400 font-bold shrink-0 mr-1.5 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Product Types:
                  </span>
                  {TYPE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedType(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        selectedType === opt.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Types: Books • FET Publications • Digital Resources • Merchandise
                </span>
              </div>
            </div>
          )}
        </div>

        {/* EDUCATIONAL & CHARITABLE CONNECTION HIGHLIGHT */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900/90 via-slate-900 to-emerald-950 text-white rounded-3xl border border-emerald-500/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                FET India Charitable & Educational Welfare Standard
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                Eligible students, seminary scholars, and partner institutions receive subsidized educational assistance, textbooks, and laboratory study materials funded by trust welfare allocations.
              </p>
            </div>
          </div>
          {onOpenDonate && (
            <button
              type="button"
              onClick={onOpenDonate}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-xs"
            >
              Support Educational Welfare
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. PRODUCT CATALOGUE GRID */}
        {/* ============================================================== */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Loading FET Store Catalog...</h3>
            <p className="text-xs text-slate-400">Connecting to official store repository</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 px-4 bg-white rounded-3xl border border-slate-200 text-center max-w-xl mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {searchTerm || selectedSubCategory !== 'all' || selectedType !== 'all'
                  ? 'No Items Match Current Filters'
                  : 'Catalogue Curation in Progress'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                {searchTerm || selectedSubCategory !== 'all' || selectedType !== 'all'
                  ? 'No published items match your selected filters. Try resetting search keywords or selecting another subcategory.'
                  : `Educational materials and publications for ${activeDepartment?.title || 'this department'} are currently undergoing syllabus review by the FET Academic Council.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubCategory('all');
                  setSelectedType('all');
                  setSelectedAvailability('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Filters
              </button>
              {activeDepartment && (
                <button
                  onClick={() => handleSelectDepartment(null)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  View All Departments
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Department-Specific Featured Spotlight Showcase Banner */}
            {activeDepartment && filteredProducts.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Department Spotlight</span>
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {activeDepartment.title} • Prescribed Trust Quality Standards
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                      Curated & Subsidized Selection for {activeDepartment.title.replace(' Department', '')}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeDepartment.shortDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectProduct(filteredProducts[0])}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Featured Record</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items in{' '}
                <strong className="text-slate-900">{activeDepartment ? activeDepartment.title : 'All Departments'}</strong>
              </span>
              {activeDepartment && (
                <button
                  onClick={() => handleSelectDepartment(null)}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  ← Return to All Departments
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isExplicitlyUnavailable = product.isAvailable === false || product.availability === 'unavailable';
                const isOutOfStock = product.availability === 'out_of_stock' || (product.trackInventory !== false && product.stockCount !== undefined && product.stockCount <= 0 && product.availability !== 'pre_order');
                const isPreOrder = product.availability === 'pre_order';
                const isLowStock = product.trackInventory !== false && product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= (product.lowStockThreshold ?? 5);

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Thumbnail Box */}
                      <div className="aspect-4/3 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        )}

                        {/* Demo Product Flag */}
                        {product.isDemo && (
                          <span className="absolute top-2.5 left-2.5 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-xs">
                            Demo / Test Item
                          </span>
                        )}

                        {/* Availability Tag */}
                        {isExplicitlyUnavailable ? (
                          <span className="absolute top-2.5 right-2.5 bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs">
                            Unavailable
                          </span>
                        ) : isOutOfStock ? (
                          <span className="absolute top-2.5 right-2.5 bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs">
                            Out of Stock
                          </span>
                        ) : isPreOrder ? (
                          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs">
                            Pre-Order
                          </span>
                        ) : isLowStock ? (
                          <span className="absolute top-2.5 right-2.5 bg-amber-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs">
                            Low Stock ({product.stockCount})
                          </span>
                        ) : null}

                        {/* Type Badge */}
                        <span className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-bold capitalize">
                          {product.productType.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Content Box */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {product.categoryName || product.category}
                          </span>
                          {product.subCategory && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                              {product.subCategory}
                            </span>
                          )}
                          {product.hasVariants && product.variants && product.variants.length > 0 && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded">
                              {product.variants.length} Options
                            </span>
                          )}
                          {Boolean(product.isDigital || product.productType === 'digital' || product.digitalAsset) && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded">
                              Digital PDF
                            </span>
                          )}
                          {product.format && (
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              {product.format}
                            </span>
                          )}
                          {product.paymentMethods === 'cod' && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                              COD Only
                            </span>
                          )}
                          {product.paymentMethods === 'razorpay' && (
                            <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded">
                              Prepaid Only
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                          {product.name}
                        </h3>

                        {product.authorOrPublisher && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                            {product.authorOrPublisher}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Price & Action Footer */}
                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-base font-black text-slate-900">
                          {product.price === 0 ? 'Free Open Access' : `₹${product.price.toLocaleString('en-IN')}`}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-xs text-slate-400 line-through ml-1.5 font-medium">
                            ₹{product.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick Add to Cart button for simple products without variant requirements */}
                        {(() => {
                          const canAdd = canAddToCart(product, null).isValid && !product.hasVariants;
                          const inCart = isItemInCart(product.id);
                          if (!canAdd) return null;

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, null, 1);
                              }}
                              className={`p-1.5 rounded-lg border transition-all text-xs font-bold cursor-pointer ${
                                inCart 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                              }`}
                              title={inCart ? `In Cart (${getItemQuantity(product.id)}) • Click to add another` : 'Quick add to cart'}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          );
                        })()}

                        <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>{product.hasVariants ? 'Options' : 'View'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. FET EDUCATIONAL & WELFARE MISSION SECTION */}
        {/* ============================================================== */}
        {!activeDepartment && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <Award className="w-3.5 h-3.5" />
                  <span>Trust Mission & Educational Foundation</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  How the FET Store Connects to Community Welfare
                </h3>
              </div>
              {onOpenDonate && (
                <button
                  type="button"
                  onClick={onOpenDonate}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Support Educational Welfare</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Grassroots Student Support & Scholarships</h4>
                <p className="leading-relaxed text-slate-600">
                  Prescribed educational textbooks and study materials are subsidized to remove economic barriers for deserving, economically underprivileged learners and competition scholars across India.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Seminary & Madrasa Educational Welfare</h4>
                <p className="leading-relaxed text-slate-600">
                  Curricular laboratory kits, ethical readers, and classroom visual teaching aids are distributed at vetted subsidized charitable rates to partner madrasas and rural educational institutions.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Community Educational Development</h4>
                <p className="leading-relaxed text-slate-600">
                  Official trust research papers, annual statutory reports, and symposium monographs are preserved under open access to strengthen institutional transparency and community advancement.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-950 text-white rounded-2xl border border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h5 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Official Institutional Notice & Subsidized Assistance
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Subsidized educational distributions are governed by the FET Academic Research & Welfare Directorate based on statutory trust allocations. Inquiries regarding institutional book grants or student aid may be directed to the official trust desk.
                </p>
              </div>
              {onOpenContact && (
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  Contact Trust Desk
                </button>
              )}
            </div>
          </section>
        )}
      </main>
      </>
      )}

      {/* Product Detail Modal Fallback */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onContactDesk={onOpenContact}
      />
    </div>
  );
};
