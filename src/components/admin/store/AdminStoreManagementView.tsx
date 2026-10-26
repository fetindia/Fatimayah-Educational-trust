/**
 * @license
 * FET Store Management Console (Super Admin & Store Admin - Task 2)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides authorized Super Admin and Store Admin portfolios with:
 * - Product Catalogue Governance (Create, Edit, View, Publish/Unpublish, Activate/Deactivate, Safe Archive/Delete)
 * - Category Taxonomy Management (Create, Edit, Activate/Deactivate, Safe Dependency-Checked Delete)
 * - Cloud Storage Image Management (Main Cover & Multi-Image Gallery with resilient streaming fallback)
 * - Professional Filters (Search, Category, Product Type, Status, Publication State)
 * - Strict RBAC & Audit Logging for all inventory interventions
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit,
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
  ExternalLink,
  BookOpen,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Star,
  Archive,
  Power,
  X,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
  FileText,
  Download,
  Lock,
  Globe,
  User,
  MapPin,
  Building,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
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
  StoreOrder,
  StoreOrderStatus
} from '../../../types';
import {
  subscribeToStoreProducts,
  subscribeToStoreCategories,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  archiveStoreProduct,
  createStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  subscribeToStoreOrders,
  updateStoreOrderStatus,
  recordStoreStaffPaymentCollection
} from '../../../lib/firebase';
import { uploadStoreProductImage, uploadStoreDigitalFile } from '../../../lib/storage';
import { ProductDetailModal } from '../../store/ProductDetailModal';
import { AdminProductFormModal } from './AdminProductFormModal';

interface AdminStoreManagementViewProps {
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DEFAULT_CATEGORIES: { name: string; slug: string; desc: string; isCore?: boolean; subcategories?: string[] }[] = [
  {
    name: "Women's Clothing",
    slug: 'womens-clothing',
    desc: 'Modest dresses, abayas, hijabs, kurtis, suits, and modest attire for women',
    subcategories: [
      'Abayas & Gowns',
      'Hijabs & Dupattas',
      'Modest Kurtis & Tunics',
      'Salwar Suits & Sets',
      'Modest Tops & Trousers',
      "Other Women's Clothing"
    ]
  },
  {
    name: "Men's Clothing",
    slug: 'mens-clothing',
    desc: 'Modest wear, kurtas, pyjamas, jubbas, thobes, and headwear for men',
    subcategories: [
      'Kurtas & Pyjamas',
      'Jubbas & Thobes',
      'Modest Shirts & Trousers',
      'Sherwanis & Waistcoats',
      'Caps & Headwear',
      "Other Men's Clothing"
    ]
  },
  {
    name: "Children's Clothing",
    slug: 'childrens-clothing',
    desc: 'Comfortable and ethical clothing for boys and girls',
    subcategories: [
      "Boys' Ethnic Wear",
      "Girls' Modest Wear",
      "Children's Jubbas & Kurtas",
      'School Uniforms',
      "Other Children's Clothing"
    ]
  },
  {
    name: 'Other Fashion and Accessories',
    slug: 'other-fashion-accessories',
    desc: 'Modest accessories, prayer wear, shawls, brooches, and bags',
    subcategories: [
      'Prayer Attire & Mats',
      'Shawls & Stoles',
      'Belts & Brooches',
      'Footwear',
      'Bags & Pouches',
      'Islamic Clothing Accessories'
    ]
  },
  {
    name: 'Books',
    slug: 'books',
    desc: 'Mandatory core category: Prescribed syllabus books, competition mastery texts & ethical literature',
    isCore: true,
    subcategories: [
      'Educational textbooks',
      'Competitive examination books',
      "Children's books",
      'Storybooks and literature',
      'Religious and cultural books',
      'FET Publications',
      'Other Books'
    ]
  },
  {
    name: 'Educational Materials',
    slug: 'materials',
    desc: 'Classroom study kits, stationery, science models, and student learning resources',
    subcategories: [
      'Study Kits',
      'Stationery & Notebooks',
      'Scientific Teaching Aids',
      'Classroom Charts & Models',
      'Competition Prep Kits'
    ]
  },
  {
    name: 'Perfumes & Fragrances',
    slug: 'perfumes',
    desc: 'Permitted non-alcoholic perfumes, concentrated attar oils, eau de parfum, and curated fragrance gifts',
    subcategories: [
      "Women's Perfumes",
      "Men's Perfumes",
      "Unisex Perfumes",
      "Eau de Parfum (EDP)",
      "Eau de Toilette (EDT)",
      "Attar and concentrated perfume oils",
      "Perfume gift sets",
      "Body mists and fragrance sprays",
      "Other Fragrance Categories"
    ]
  },
  {
    name: 'FET Publications',
    slug: 'publications',
    desc: 'Official trust research journals, scholarly symposium papers, and annual reports',
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
    desc: 'E-books, downloadable lecture notes, audio series & digital study compendiums',
    subcategories: [
      'E-Books',
      'Digital Lecture Recordings',
      'Competition Study Guides'
    ]
  },
  {
    name: 'Merchandise',
    slug: 'merchandise',
    desc: 'Trust commemorative insignia, academic badges, pins, and ethical lifestyle items',
    subcategories: [
      'Trust Insignia Badges',
      'Commemorative Plaques',
      'Trust Pens & Stationery'
    ]
  },
  {
    name: 'Islamic Wear',
    slug: 'islamic-wear',
    desc: 'Modest Islamic clothing, prayer attire, abayas, kurtas, and modest apparel accessories',
    subcategories: [
      "Men's Islamic Wear",
      "Women's Islamic Wear",
      "Children's Islamic Wear",
      'Muslim Wear / Modest Wear',
      'Prayer Wear',
      'Islamic Clothing Accessories'
    ]
  },
  {
    name: 'Islamic & Educational Products',
    slug: 'islamic-educational',
    desc: 'Ethical learning tools, moral science kits, and Islamic educational artifacts',
    subcategories: [
      'Moral Education Toolkits',
      'Islamic Calligraphy Art',
      'Prayer Mats & Accessories'
    ]
  },
  {
    name: 'Other Products',
    slug: 'other',
    desc: 'Curated community welfare resources and miscellaneous charitable store items',
    subcategories: [
      'General Community Supplies',
      'Miscellaneous'
    ]
  }
];

export const generateProductSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const PRODUCT_TYPE_LABELS: Record<StoreProductType, string> = {
  book: 'Prescribed Book',
  publication: 'FET Publication',
  educational_material: 'Educational Material',
  educational_resource: 'Educational Resource',
  digital: 'Digital Resource',
  clothing: 'Physical Clothing',
  fashion: 'Modest Fashion & Wear',
  perfume: 'Perfume & Fragrance',
  fragrance: 'Fragrance & Attar',
  physical: 'Physical Product',
  merchandise: 'Modest Merchandise',
  other: 'Other Resource'
};

export const AdminStoreManagementView: React.FC<AdminStoreManagementViewProps> = ({ onNotify }) => {
  const { currentUser, userProfile, activeRole, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'overview'>('products');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Orders State (Store Task 14 & 15)
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState<boolean>(true);
  const [orderSearchTerm, setOrderSearchTerm] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState<boolean>(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState<boolean>(false);
  const [newOrderStatus, setNewOrderStatus] = useState<StoreOrderStatus>('draft');
  const [orderStatusNote, setOrderStatusNote] = useState<string>('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | StoreProductType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable' | 'low_stock' | 'pre_order'>('all');

  // Preview Modal
  const [previewProduct, setPreviewProduct] = useState<StoreProduct | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);

  // Safe Deletion / Archiving Modal States
  const [deletingProduct, setDeletingProduct] = useState<StoreProduct | null>(null);
  const [deleteMode, setDeleteMode] = useState<'archive' | 'permanent'>('archive');
  const [categoryToDelete, setCategoryToDelete] = useState<StoreCategory | null>(null);
  const [categoryDepWarning, setCategoryDepWarning] = useState<string | null>(null);

  // Product Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('books');
  const [formCategoryName, setFormCategoryName] = useState<string>('Books');
  const [formSubCategory, setFormSubCategory] = useState<string>('');
  const [formProductType, setFormProductType] = useState<StoreProductType>('book');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formAvailability, setFormAvailability] = useState<StoreProductAvailability>('in_stock');
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formTrackInventory, setFormTrackInventory] = useState<boolean>(true);
  const [formStock, setFormStock] = useState<number>(0);
  const [formLowStockThreshold, setFormLowStockThreshold] = useState<number>(5);
  const [formStatus, setFormStatus] = useState<StoreProductStatus>('ACTIVE');
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formSku, setFormSku] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formProductImages, setFormProductImages] = useState<string[]>([]);
  const [newImageInput, setNewImageInput] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('');
  const [formFeatures, setFormFeatures] = useState<string>('');
  const [formHasVariants, setFormHasVariants] = useState<boolean>(false);
  const [formVariantOptions, setFormVariantOptions] = useState<StoreProductOption[]>([]);
  const [formVariants, setFormVariants] = useState<StoreProductVariant[]>([]);
  const [newOptionName, setNewOptionName] = useState<string>('');
  const [newOptionValue, setNewOptionValue] = useState<string>('');

  // Digital & Book Product State
  const [formIsDigital, setFormIsDigital] = useState<boolean>(false);
  const [formDigitalAsset, setFormDigitalAsset] = useState<StoreDigitalAsset | null>(null);
  const [formDigitalAccessType, setFormDigitalAccessType] = useState<StoreDigitalAccessType>('public_download');
  const [formDigitalFileName, setFormDigitalFileName] = useState<string>('');
  const [formDigitalFileUrl, setFormDigitalFileUrl] = useState<string>('');
  const [formDigitalPageCount, setFormDigitalPageCount] = useState<number | ''>('');
  const [formDigitalPreviewUrl, setFormDigitalPreviewUrl] = useState<string>('');
  const [formLanguage, setFormLanguage] = useState<string>('');
  const [formEdition, setFormEdition] = useState<string>('');
  const [formFormat, setFormFormat] = useState<string>('');
  const [formPagesCount, setFormPagesCount] = useState<number | ''>('');
  const [isUploadingDigital, setIsUploadingDigital] = useState<boolean>(false);
  const [uploadProgressDigital, setUploadProgressDigital] = useState<number>(0);
  const digitalFileInputRef = useRef<HTMLInputElement>(null);

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File Upload State
  const [isUploadingMain, setIsUploadingMain] = useState<boolean>(false);
  const [uploadProgressMain, setUploadProgressMain] = useState<number>(0);
  const [isUploadingGallery, setIsUploadingGallery] = useState<boolean>(false);
  const [uploadProgressGallery, setUploadProgressGallery] = useState<number>(0);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Category Form Fields
  const [catName, setCatName] = useState<string>('');
  const [catSlug, setCatSlug] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');
  const [catSubcategories, setCatSubcategories] = useState<string>('');
  const [catIsCore, setCatIsCore] = useState<boolean>(false);
  const [catIsActive, setCatIsActive] = useState<boolean>(true);
  const [catSubmitting, setCatSubmitting] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onNotify) {
      onNotify(message, type);
    }
  };

  // Subscribe to store products, categories, and orders in real-time
  useEffect(() => {
    setIsLoading(true);
    const unsubProducts = subscribeToStoreProducts((list) => {
      setProducts(list);
      setIsLoading(false);
    });

    const unsubCategories = subscribeToStoreCategories((cats) => {
      setCategories(cats);
    });

    const unsubOrders = subscribeToStoreOrders((orderList) => {
      setOrders(orderList);
      setIsOrdersLoading(false);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
    };
  }, []);

  // Compute Order Metrics (Task 14 & 15)
  const orderMetrics = useMemo(() => {
    const total = orders.length;
    const drafts = orders.filter(o => o.orderStatus === 'draft').length;
    const pendingPayment = orders.filter(o => o.orderStatus === 'pending_payment').length;
    const processing = orders.filter(o => ['paid', 'processing', 'shipped'].includes(o.orderStatus)).length;
    const delivered = orders.filter(o => o.orderStatus === 'delivered').length;
    const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;
    const refunded = orders.filter(o => o.orderStatus === 'refunded').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    return { total, drafts, pendingPayment, processing, delivered, cancelled, refunded, totalRevenue };
  }, [orders]);

  // Filtered Orders (Task 14 & 15)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (orderStatusFilter !== 'all' && order.orderStatus !== orderStatusFilter) {
        return false;
      }
      if (orderDateFilter !== 'all' && order.createdAt) {
        const orderTime = new Date(order.createdAt).getTime();
        const now = Date.now();
        if (orderDateFilter === 'today') {
          const isToday = new Date(order.createdAt).toDateString() === new Date().toDateString();
          if (!isToday) return false;
        } else if (orderDateFilter === '7days') {
          if (now - orderTime > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (orderDateFilter === '30days') {
          if (now - orderTime > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }
      if (orderSearchTerm.trim()) {
        const q = orderSearchTerm.toLowerCase();
        const numMatch = order.orderNumber?.toLowerCase().includes(q) || order.id?.toLowerCase().includes(q);
        const nameMatch = order.customer?.fullName?.toLowerCase().includes(q);
        const emailMatch = order.customer?.email?.toLowerCase().includes(q);
        const phoneMatch = order.customer?.mobileNumber?.includes(q);
        if (!numMatch && !nameMatch && !emailMatch && !phoneMatch) {
          return false;
        }
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderDateFilter, orderSearchTerm]);

  // Compute strictly allowed next status transitions based on current order state and permissions
  const availableNextStatuses = useMemo(() => {
    if (!selectedOrder) return [];
    const current = selectedOrder.orderStatus;
    const isSuper = Boolean(isSuperAdmin);
    const options: { value: StoreOrderStatus; label: string }[] = [];

    if (current === 'draft') {
      options.push({ value: 'pending_payment', label: 'Pending Payment' });
      options.push({ value: 'processing', label: 'Processing (Desk Order)' });
      options.push({ value: 'cancelled', label: 'Cancelled' });
    } else if (current === 'pending_payment') {
      if (isSuper) options.push({ value: 'paid', label: 'Paid (Super Admin Override)' });
      options.push({ value: 'processing', label: 'Processing' });
      options.push({ value: 'cancelled', label: 'Cancelled' });
    } else if (current === 'paid') {
      options.push({ value: 'processing', label: 'Processing' });
      options.push({ value: 'cancelled', label: 'Cancelled' });
    } else if (current === 'processing') {
      options.push({ value: 'shipped', label: 'Shipped / Dispatched' });
      options.push({ value: 'cancelled', label: 'Cancelled' });
    } else if (current === 'shipped') {
      options.push({ value: 'delivered', label: 'Delivered' });
      options.push({ value: 'cancelled', label: 'Cancelled (Delivery Returned)' });
    } else if (current === 'delivered' && isSuper) {
      options.push({ value: 'refunded', label: 'Refunded (Super Admin Clearance)' });
    }

    return options;
  }, [selectedOrder, isSuperAdmin]);

  // Status Update Handler with Audit Trail
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !newOrderStatus) return;
    setIsUpdatingOrderStatus(true);
    try {
      await updateStoreOrderStatus(
        selectedOrder.id,
        newOrderStatus,
        orderStatusNote.trim() || undefined,
        currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email || 'admin@fetindia.org',
          role: activeRole || 'store_manager'
        } : undefined
      );

      setSelectedOrder(prev => prev ? {
        ...prev,
        orderStatus: newOrderStatus,
        updatedAt: new Date().toISOString()
      } : null);

      if (onNotify) {
        onNotify(`Order ${selectedOrder.orderNumber} status updated to ${newOrderStatus}.`, 'success');
      }
      setOrderStatusNote('');
    } catch (err: any) {
      if (onNotify) {
        onNotify(err.message || 'Failed to update order status.', 'error');
      }
    } finally {
      setIsUpdatingOrderStatus(false);
    }
  };

  // Staff Payment Collection Handler for COD Orders
  const handleRecordCodPayment = async () => {
    if (!selectedOrder || !currentUser) return;
    setIsRecordingPayment(true);
    try {
      const res = await recordStoreStaffPaymentCollection({
        orderId: selectedOrder.id,
        actorUid: currentUser.uid,
        paymentMethod: selectedOrder.paymentMethod || 'COD',
        notes: `Cash collection recorded by staff ${currentUser.email || currentUser.uid}`
      });
      setSelectedOrder(prev => prev ? {
        ...prev,
        paymentStatus: 'captured',
        orderStatus: prev.orderStatus === 'pending_payment' ? 'processing' : prev.orderStatus,
        paidAt: new Date().toISOString()
      } : null);
      if (onNotify) {
        onNotify(res.message || 'Payment collection recorded successfully.', 'success');
      }
    } catch (err: any) {
      if (onNotify) {
        onNotify(err.message || 'Failed to record payment collection.', 'error');
      }
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Compute Metrics
  const metrics = useMemo(() => {
    const total = products.length;
    const published = products.filter((p) => p.isPublished && p.status !== 'INACTIVE' && p.status !== 'ARCHIVED' && p.isActive !== false).length;
    const active = products.filter((p) => p.status !== 'INACTIVE' && p.status !== 'ARCHIVED' && p.isActive !== false).length;
    const inactiveOrDraft = total - published;
    const archived = products.filter((p) => p.status === 'ARCHIVED' || p.isArchived === true).length;
    return { total, published, active, inactiveOrDraft, archived, totalCategories: categories.length };
  }, [products, categories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Publication filter
      if (publishFilter === 'published' && !p.isPublished) return false;
      if (publishFilter === 'unpublished' && p.isPublished) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const prodStatus = p.status || (p.isActive === false ? 'INACTIVE' : 'ACTIVE');
        if (prodStatus !== statusFilter) return false;
      }

      // Product Type filter
      if (typeFilter !== 'all' && p.productType !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

      // Subcategory filter
      if (subcategoryFilter !== 'all' && p.subCategory !== subcategoryFilter) return false;

      // Availability filter
      if (availabilityFilter !== 'all') {
        const isAvail = p.isAvailable !== false && p.availability !== 'unavailable' && p.availability !== 'out_of_stock' && !(p.trackInventory !== false && p.stockCount !== undefined && p.stockCount <= 0 && p.availability !== 'pre_order');
        if (availabilityFilter === 'available' && !isAvail) return false;
        if (availabilityFilter === 'unavailable' && isAvail) return false;
        if (availabilityFilter === 'pre_order' && p.availability !== 'pre_order') return false;
        if (availabilityFilter === 'low_stock') {
          const isLow = p.trackInventory !== false && p.stockCount !== undefined && p.stockCount > 0 && p.stockCount <= (p.lowStockThreshold ?? 5);
          if (!isLow) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          p.subCategory?.toLowerCase().includes(q) ||
          p.authorOrPublisher?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, publishFilter, statusFilter, typeFilter, categoryFilter, subcategoryFilter, availabilityFilter, searchTerm]);

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    const defaultCat = categories[0] || DEFAULT_CATEGORIES[0];
    setFormCategory(defaultCat.slug);
    setFormCategoryName(defaultCat.name);
    setFormSubCategory('');
    setFormProductType('book');
    setFormPrice(0);
    setFormMrp(0);
    setFormAvailability('in_stock');
    setFormIsAvailable(true);
    setFormTrackInventory(true);
    setFormStock(25);
    setFormLowStockThreshold(5);
    setFormStatus('ACTIVE');
    setFormIsPublished(true);
    setFormSku('');
    setFormImageUrl('');
    setFormProductImages([]);
    setNewImageInput('');
    setFormAuthor('');
    setFormFeatures('');
    setFormHasVariants(false);
    setFormVariantOptions([]);
    setFormVariants([]);
    setNewOptionName('');
    setNewOptionValue('');
    setFormIsDigital(false);
    setFormDigitalAsset(null);
    setFormDigitalAccessType('public_download');
    setFormDigitalFileName('');
    setFormDigitalFileUrl('');
    setFormDigitalPageCount('');
    setFormDigitalPreviewUrl('');
    setFormLanguage('');
    setFormEdition('');
    setFormFormat('');
    setFormPagesCount('');
    setIsUploadingDigital(false);
    setUploadProgressDigital(0);
    setFormError(null);
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: StoreProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSlug(prod.slug || generateProductSlug(prod.name));
    setFormDesc(prod.description);
    setFormCategory(prod.category);
    setFormCategoryName(prod.categoryName || prod.category);
    setFormSubCategory(prod.subCategory || '');
    setFormProductType(prod.productType);
    setFormPrice(prod.price);
    setFormMrp(prod.mrp || 0);
    setFormAvailability(prod.availability || 'in_stock');
    const isAvail = prod.isAvailable !== false && prod.availability !== 'unavailable' && prod.availability !== 'out_of_stock';
    setFormIsAvailable(isAvail);
    setFormTrackInventory(prod.trackInventory !== false && prod.productType !== 'digital');
    setFormStock(prod.stockCount ?? 0);
    setFormLowStockThreshold(prod.lowStockThreshold ?? 5);
    setFormStatus((prod.status as StoreProductStatus) || (prod.isActive === false ? 'INACTIVE' : 'ACTIVE'));
    setFormIsPublished(prod.isPublished);
    setFormSku(prod.sku || '');
    setFormImageUrl(prod.imageUrl || '');
    setFormProductImages(prod.productImages || []);
    setNewImageInput('');
    setFormAuthor(prod.authorOrPublisher || '');
    setFormFeatures((prod.features || []).join(', '));
    setFormHasVariants(prod.hasVariants ?? false);
    setFormVariantOptions(prod.variantOptions || []);
    setFormVariants(prod.variants || []);
    setNewOptionName('');
    setNewOptionValue('');
    setFormIsDigital(Boolean(prod.isDigital || prod.productType === 'digital' || prod.digitalAsset));
    setFormDigitalAsset(prod.digitalAsset || null);
    setFormDigitalAccessType(prod.digitalAsset?.accessType || 'public_download');
    setFormDigitalFileName(prod.digitalAsset?.fileName || '');
    setFormDigitalFileUrl(prod.digitalAsset?.fileUrl || '');
    setFormDigitalPageCount(prod.digitalAsset?.pageCount ?? prod.pagesCount ?? '');
    setFormDigitalPreviewUrl(prod.digitalAsset?.previewUrl || '');
    setFormLanguage(prod.language || '');
    setFormEdition(prod.edition || '');
    setFormFormat(prod.format || '');
    setFormPagesCount(prod.pagesCount ?? '');
    setIsUploadingDigital(false);
    setUploadProgressDigital(0);
    setFormError(null);
    setIsProductModalOpen(true);
  };

  // Upload Main Image
  const handleUploadMainImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMain(true);
    setUploadProgressMain(10);
    try {
      const res = await uploadStoreProductImage(file, (pct) => setUploadProgressMain(pct));
      setFormImageUrl(res.url);
      showToast('Main product image uploaded successfully.');
    } catch (err: any) {
      console.error('Error uploading product image:', err);
      showToast(err?.message || 'Failed to upload image.', 'error');
    } finally {
      setIsUploadingMain(false);
      setUploadProgressMain(0);
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    }
  };

  // Upload Additional Image to Gallery
  const handleUploadGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingGallery(true);
    setUploadProgressGallery(10);
    try {
      const res = await uploadStoreProductImage(file, (pct) => setUploadProgressGallery(pct));
      if (!formProductImages.includes(res.url)) {
        setFormProductImages([...formProductImages, res.url]);
      }
      showToast('Additional product image added to gallery.');
    } catch (err: any) {
      console.error('Error uploading gallery image:', err);
      showToast(err?.message || 'Failed to upload gallery image.', 'error');
    } finally {
      setIsUploadingGallery(false);
      setUploadProgressGallery(0);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  // Add Image URL to Gallery
  const handleAddImageUrl = () => {
    if (!newImageInput.trim()) return;
    const url = newImageInput.trim();
    if (!formProductImages.includes(url)) {
      setFormProductImages([...formProductImages, url]);
      setNewImageInput('');
    }
  };

  // Remove Image from Gallery
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setFormProductImages(formProductImages.filter((_, idx) => idx !== indexToRemove));
  };

  // Upload Digital Product File (PDF, eBook, curriculum resource)
  const handleUploadDigitalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDigital(true);
    setUploadProgressDigital(15);
    try {
      const res = await uploadStoreDigitalFile(file, editingProduct?.id, (pct) => setUploadProgressDigital(pct));
      setFormDigitalFileUrl(res.url);
      setFormDigitalFileName(res.fileName);
      setFormIsDigital(true);
      showToast(`Digital publication file "${res.fileName}" uploaded successfully.`);
    } catch (err: any) {
      console.error('Error uploading digital product file:', err);
      showToast(err?.message || 'Failed to upload digital file.', 'error');
    } finally {
      setIsUploadingDigital(false);
      setUploadProgressDigital(0);
      if (digitalFileInputRef.current) {
        digitalFileInputRef.current.value = '';
      }
    }
  };

  // Promote any image from gallery to primary/featured image
  const handleSetPrimaryImage = (targetUrl: string) => {
    if (!targetUrl || targetUrl === formImageUrl) return;
    const oldPrimary = formImageUrl;
    setFormImageUrl(targetUrl);
    // Keep previous primary in gallery list so no image is lost
    const filtered = formProductImages.filter((url) => url !== targetUrl);
    if (oldPrimary && !filtered.includes(oldPrimary)) {
      filtered.unshift(oldPrimary);
    }
    setFormProductImages(filtered);
    showToast('Cover image updated: Selected image is now primary.');
  };

  // Remove primary image and promote first gallery image if present
  const handleRemovePrimaryImage = () => {
    if (formProductImages.length > 0) {
      const [firstGallery, ...rest] = formProductImages;
      setFormImageUrl(firstGallery);
      setFormProductImages(rest);
      showToast('Cover image updated from gallery.');
    } else {
      setFormImageUrl('');
      showToast('Cover image cleared.');
    }
  };

  // --- Variant Management Helpers ---
  const handleAddOption = (name: string, defaultValues: string[] = []) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (formVariantOptions.some((o) => o.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Option "${trimmed}" already exists.`, 'error');
      return;
    }
    setFormVariantOptions((prev) => [...prev, { name: trimmed, values: defaultValues }]);
    setNewOptionName('');
  };

  const handleRemoveOption = (index: number) => {
    setFormVariantOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddOptionValue = (optionIndex: number, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setFormVariantOptions((prev) => {
      const copy = [...prev];
      const opt = copy[optionIndex];
      if (opt && !opt.values.includes(trimmed)) {
        copy[optionIndex] = { ...opt, values: [...opt.values, trimmed] };
      }
      return copy;
    });
  };

  const handleRemoveOptionValue = (optionIndex: number, valueIndex: number) => {
    setFormVariantOptions((prev) => {
      const copy = [...prev];
      const opt = copy[optionIndex];
      if (opt) {
        copy[optionIndex] = { ...opt, values: opt.values.filter((_, i) => i !== valueIndex) };
      }
      return copy;
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'clothing_size':
        handleAddOption('Size', ['S', 'M', 'L', 'XL', 'XXL']);
        break;
      case 'clothing_color':
        handleAddOption('Color', ['Black', 'White', 'Navy Blue', 'Olive', 'Grey']);
        break;
      case 'book_language':
        handleAddOption('Language', ['English', 'Urdu', 'Hindi', 'Arabic']);
        break;
      case 'book_format':
        handleAddOption('Format', ['Paperback', 'Hardcover', 'Digital PDF (eBook)']);
        break;
      case 'book_edition':
        handleAddOption('Edition', ['Standard Edition', 'Student Edition', 'Scholarly Deluxe']);
        break;
      case 'perfume_volume':
        handleAddOption('Fragrance / Volume', ['3ml Concentrated Attar', '6ml Concentrated Attar', '12ml Concentrated Attar', '50ml EDP Spray']);
        break;
      default:
        break;
    }
  };

  const handleGenerateVariantsFromOptions = () => {
    if (formVariantOptions.length === 0) {
      showToast('Please add at least one option with values to generate variants.', 'error');
      return;
    }
    const validOptions = formVariantOptions.filter((o) => o.values.length > 0);
    if (validOptions.length === 0) {
      showToast('All configured options have empty values.', 'error');
      return;
    }

    // Cartesian product of all option values
    let combinations: Record<string, string>[] = [{}];
    for (const opt of validOptions) {
      const nextCombos: Record<string, string>[] = [];
      for (const current of combinations) {
        for (const val of opt.values) {
          nextCombos.push({ ...current, [opt.name]: val });
        }
      }
      combinations = nextCombos;
    }

    if (combinations.length > 50) {
      showToast(`Limiting generated variants to 50 combinations.`, 'info');
      combinations = combinations.slice(0, 50);
    }

    const newVariantsList: StoreProductVariant[] = combinations.map((attrs, idx) => {
      const variantName = Object.entries(attrs)
        .map(([_, v]) => `${v}`)
        .join(' / ');

      const existingMatch = formVariants.find(
        (v) => v.name.toLowerCase() === variantName.toLowerCase()
      );

      if (existingMatch) {
        return {
          ...existingMatch,
          attributes: attrs
        };
      }

      const abbrSku = Object.values(attrs)
        .map((v) => v.substring(0, 3).toUpperCase())
        .join('-');

      return {
        id: `var_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        name: variantName,
        sku: formSku ? `${formSku.trim()}-${abbrSku}` : `VAR-${abbrSku}`,
        price: formPrice > 0 ? formPrice : undefined,
        mrp: formMrp && formMrp > 0 ? formMrp : undefined,
        availability: formAvailability,
        isAvailable: formIsAvailable,
        stockCount: formTrackInventory ? Math.max(1, Math.floor(formStock / (combinations.length || 1))) : undefined,
        trackInventory: formTrackInventory,
        imageUrl: formImageUrl || undefined,
        attributes: attrs
      };
    });

    setFormVariants(newVariantsList);
    showToast(`Generated ${newVariantsList.length} variant combination(s).`);
  };

  const handleAddManualVariant = () => {
    const id = `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVar: StoreProductVariant = {
      id,
      name: `Variant ${formVariants.length + 1}`,
      sku: formSku ? `${formSku.trim()}-V${formVariants.length + 1}` : `VAR-${formVariants.length + 1}`,
      price: formPrice > 0 ? formPrice : undefined,
      mrp: formMrp && formMrp > 0 ? formMrp : undefined,
      availability: formAvailability,
      isAvailable: formIsAvailable,
      stockCount: formTrackInventory ? 10 : undefined,
      trackInventory: formTrackInventory,
      imageUrl: formImageUrl || undefined
    };
    setFormVariants((prev) => [...prev, newVar]);
  };

  const handleUpdateVariant = (variantId: string, updates: Partial<StoreProductVariant>) => {
    setFormVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, ...updates } : v))
    );
  };

  const handleRemoveVariant = (variantId: string) => {
    setFormVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  // Save Product (from Category-Based Smart Modal)
  const handleSaveProductFromModal = async (payload: Partial<StoreProduct>, isDraft: boolean) => {
    if (!currentUser) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const actorInfo = {
        uid: currentUser.uid,
        email: currentUser.email || 'store_admin@fetindia.org'
      };

      if (editingProduct) {
        await updateStoreProduct(editingProduct.id, payload, actorInfo);
        showToast(isDraft ? `Product "${payload.name}" saved as draft.` : `Product "${payload.name}" updated successfully.`);
      } else {
        await createStoreProduct(payload as any, actorInfo);
        showToast(isDraft ? `Product "${payload.name}" saved as draft.` : `Product "${payload.name}" published successfully.`);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Error saving store product:', err);
      setFormError(err?.message || 'Failed to save store product.');
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  // 1-Click Toggle Available / Unavailable
  const handleToggleAvailable = async (prod: StoreProduct) => {
    if (!currentUser) return;
    try {
      const isCurrentlyAvail = prod.isAvailable !== false && prod.availability !== 'unavailable' && prod.availability !== 'out_of_stock';
      const newAvail = !isCurrentlyAvail;
      await updateStoreProduct(
        prod.id,
        {
          isAvailable: newAvail,
          availability: newAvail ? 'in_stock' : 'unavailable'
        },
        { uid: currentUser.uid, email: currentUser.email || 'store_admin@fetindia.org' }
      );
      showToast(`Product "${prod.name}" marked as ${newAvail ? 'Available' : 'Unavailable'}.`);
    } catch (err: any) {
      console.error('Failed to toggle product availability:', err);
      showToast(err?.message || 'Failed to update product availability.', 'error');
    }
  };

  // 1-Click Toggle Published State
  const handleTogglePublish = async (prod: StoreProduct) => {
    if (!currentUser) return;
    const newPublished = !prod.isPublished;
    try {
      await updateStoreProduct(
        prod.id,
        { 
          isPublished: newPublished,
          // If publishing, ensure active
          ...(newPublished ? { status: 'ACTIVE', isActive: true, isArchived: false } : {})
        },
        { uid: currentUser.uid, email: currentUser.email || 'admin@fetindia.org' }
      );
      showToast(`Product "${prod.name}" ${newPublished ? 'published to live catalog' : 'moved to unpublished drafts'}.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update publication status.', 'error');
    }
  };

  // 1-Click Toggle Active / Inactive State
  const handleToggleActive = async (prod: StoreProduct) => {
    if (!currentUser) return;
    const currentlyActive = prod.status !== 'INACTIVE' && prod.status !== 'ARCHIVED' && prod.isActive !== false;
    const newStatus: StoreProductStatus = currentlyActive ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateStoreProduct(
        prod.id,
        {
          status: newStatus,
          isActive: !currentlyActive,
          // When deactivating, also withdraw from public view
          isPublished: currentlyActive ? false : prod.isPublished
        },
        { uid: currentUser.uid, email: currentUser.email || 'admin@fetindia.org' }
      );
      showToast(`Product "${prod.name}" marked as ${newStatus}.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update active status.', 'error');
    }
  };

  // Open Safe Delete / Archive Confirmation Modal
  const handleOpenDeleteModal = (prod: StoreProduct) => {
    setDeletingProduct(prod);
    setDeleteMode('archive');
  };

  // Execute Product Archive or Permanent Delete
  const handleConfirmProductDelete = async () => {
    if (!deletingProduct || !currentUser) return;

    try {
      const actorInfo = {
        uid: currentUser.uid,
        email: currentUser.email || 'super_admin@fetindia.org'
      };

      if (deleteMode === 'archive') {
        await archiveStoreProduct(deletingProduct.id, actorInfo);
        showToast(`Product "${deletingProduct.name}" archived safely.`);
      } else {
        await deleteStoreProduct(deletingProduct.id, actorInfo);
        showToast(`Product "${deletingProduct.name}" permanently deleted.`);
      }
      setDeletingProduct(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to complete delete operation.', 'error');
    }
  };

  // Open Add Category Modal
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatSubcategories('');
    setCatIsCore(false);
    setCatIsActive(true);
    setIsCategoryModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !catName.trim()) return;

    setCatSubmitting(true);
    const slug = catSlug.trim() || catName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const subcats = catSubcategories
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Prevent duplicate category names (Requirement 5)
    const isDuplicate = categories.some(
      (c) =>
        (!editingCategory || c.id !== editingCategory.id) &&
        (c.name.trim().toLowerCase() === catName.trim().toLowerCase() ||
         (c.slug && slug && c.slug.trim().toLowerCase() === slug.toLowerCase()))
    );
    if (isDuplicate) {
      showToast(`Category "${catName}" already exists. Duplicate category names are not permitted.`, 'error');
      setCatSubmitting(false);
      return;
    }

    try {
      const actorInfo = { uid: currentUser.uid, email: currentUser.email || 'admin@fetindia.org' };

      if (editingCategory) {
        await updateStoreCategory(
          editingCategory.id,
          {
            name: catName.trim(),
            slug,
            description: catDesc.trim(),
            subcategories: subcats,
            isCore: catIsCore || editingCategory.isCore || slug === 'books',
            isActive: catIsActive
          },
          actorInfo
        );
        showToast(`Category "${catName}" updated.`);
      } else {
        await createStoreCategory(
          {
            name: catName.trim(),
            slug,
            description: catDesc.trim(),
            subcategories: subcats,
            isCore: catIsCore || slug === 'books',
            isActive: catIsActive,
            displayOrder: categories.length + 1
          },
          actorInfo
        );
        showToast(`Category "${catName}" created.`);
      }

      setIsCategoryModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save category.', 'error');
    } finally {
      setCatSubmitting(false);
    }
  };

  // 1-Click Toggle Category Active Status
  const handleToggleCategoryActive = async (cat: StoreCategory) => {
    if (!currentUser) return;
    const newActive = !(cat.isActive !== false);
    try {
      await updateStoreCategory(
        cat.id,
        { isActive: newActive },
        { uid: currentUser.uid, email: currentUser.email || 'admin@fetindia.org' }
      );
      showToast(`Category "${cat.name}" is now ${newActive ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update category status.', 'error');
    }
  };

  // Safe Category Deletion Check
  const handleRequestDeleteCategory = (cat: StoreCategory) => {
    if (cat.isCore || cat.slug === 'books') {
      setCategoryToDelete(cat);
      setCategoryDepWarning(
        `Mandatory Core Category: "${cat.name}" is a permanent core category of FET Store and cannot be deleted. You may deactivate it or manage its subcategories.`
      );
      return;
    }

    const dependentProducts = products.filter(
      (p) => p.category === cat.slug || p.category === cat.id || p.category === cat.name
    );

    setCategoryToDelete(cat);
    if (dependentProducts.length > 0) {
      setCategoryDepWarning(
        `Safety Restriction: Cannot delete "${cat.name}" because ${dependentProducts.length} product(s) currently depend on it. Please reassign or archive these products first, or toggle this category to Inactive.`
      );
    } else {
      setCategoryDepWarning(null);
    }
  };

  // Execute Safe Category Delete
  const handleConfirmCategoryDelete = async () => {
    if (!categoryToDelete || !currentUser) return;
    if (categoryToDelete.isCore || categoryToDelete.slug === 'books') {
      showToast('Books is a mandatory core category and cannot be deleted.', 'error');
      return;
    }

    try {
      await deleteStoreCategory(categoryToDelete.id, {
        uid: currentUser.uid,
        email: currentUser.email || 'admin@fetindia.org'
      });
      showToast(`Category "${categoryToDelete.name}" deleted.`);
      setCategoryToDelete(null);
      setCategoryDepWarning(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete category.', 'error');
    }
  };

  // Seed standard categories if none exist
  const handleSeedStandardCategories = async () => {
    if (!currentUser || categories.length > 0) return;
    try {
      const actor = { uid: currentUser.uid, email: currentUser.email || 'admin@fetindia.org' };
      for (const [idx, item] of DEFAULT_CATEGORIES.entries()) {
        await createStoreCategory(
          {
            name: item.name,
            slug: item.slug,
            description: item.desc,
            subcategories: item.subcategories,
            isCore: item.isCore,
            isActive: true,
            displayOrder: idx + 1
          },
          actor
        );
      }
      showToast('Standard store categories provisioned successfully.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to seed categories.', 'error');
    }
  };

  return (
    <div className="space-y-6" id="admin-store-management-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">FET Store Management Console</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official Store Administration
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Curate, edit, and publish official trust educational materials, publications, and modest merchandise. Controlled via Super Admin, Store Admin, and Store Manager portfolios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Inventory Items
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1.5">{metrics.total}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Configured inventory records</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Published Live Items
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1.5">{metrics.published}</div>
          <span className="text-[11px] text-emerald-800 font-medium mt-0.5 block">Visible on public store</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Drafts & Inactive
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1.5">{metrics.inactiveOrDraft}</div>
          <span className="text-[11px] text-amber-800 font-medium mt-0.5 block">Hidden from public view</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
            Categories Configured
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1.5">{metrics.totalCategories}</div>
          <span className="text-[11px] text-indigo-800 font-medium mt-0.5 block">Taxonomy classifications</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span>Product Catalogue ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span>Category Taxonomy ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
          <span>Customer Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Store Architecture Constitution</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PRODUCT CATALOGUE */}
      {/* ============================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products by title, SKU, author, or description..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Publication Status Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl shrink-0">
                {(['all', 'published', 'unpublished'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPublishFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      publishFilter === filter
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Filters: Status, Type & Category */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Filters:
              </span>

              {/* Active / Inactive Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {/* Product Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">All Product Types</option>
                {Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setSubcategoryFilter('all');
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug || c.name}>{c.name}</option>
                  ))}
                </select>
              )}

              {/* Subcategory Filter (when category selected) */}
              {categoryFilter !== 'all' && (
                <select
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 cursor-pointer"
                >
                  <option value="all">All Subcategories</option>
                  {(() => {
                    const selCat = categories.find(c => c.slug === categoryFilter || c.id === categoryFilter || c.name === categoryFilter) || DEFAULT_CATEGORIES.find(c => c.slug === categoryFilter);
                    const subcatOptions = selCat?.subcategories || [];
                    const prodSubcats = Array.from(new Set(products.filter(p => (p.category === categoryFilter || p.categoryName === categoryFilter) && p.subCategory).map(p => p.subCategory as string)));
                    const allSubs = Array.from(new Set([...subcatOptions, ...prodSubcats]));
                    return allSubs.map((sc, i) => (
                      <option key={i} value={sc}>{sc}</option>
                    ));
                  })()}
                </select>
              )}

              {/* Availability Filter */}
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">All Availability</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Unavailable Only</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="pre_order">Pre-Order Only</option>
              </select>

              {(searchTerm || publishFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all' || availabilityFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPublishFilter('all');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setCategoryFilter('all');
                    setSubcategoryFilter('all');
                    setAvailabilityFilter('all');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors ml-auto cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Product Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Configured Inventory Items</h3>
                <p className="text-xs text-slate-500">Live products, inactive records, and drafts managed by FET India</p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {filteredProducts.length} Item(s) Found
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
                <span className="text-xs font-bold">Synchronizing store inventory...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Store Products Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm || publishFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || subcategoryFilter !== 'all'
                    ? 'No products match the active filter criteria.'
                    : 'The catalogue currently contains no products. Click "Add Product" above to create your first educational publication, textbook, or modest merchandise.'}
                </p>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Category & Type</th>
                      <th className="py-3 px-4 text-right">Price (INR)</th>
                      <th className="py-3 px-4 text-center">Availability</th>
                      <th className="py-3 px-4 text-center">Active Status</th>
                      <th className="py-3 px-4 text-center">Live Catalog</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredProducts.map((prod) => {
                      const isActive = prod.status !== 'INACTIVE' && prod.status !== 'ARCHIVED' && prod.isActive !== false;
                      const isArchived = prod.status === 'ARCHIVED' || prod.isArchived === true;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Product Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 relative">
                                {prod.imageUrl ? (
                                  <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-400" />
                                )}
                                {prod.productImages && prod.productImages.length > 0 && (
                                  <span className="absolute bottom-0.5 right-0.5 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded">
                                    +{prod.productImages.length}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 line-clamp-1">{prod.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {prod.sku || `ID: ${prod.id.slice(0, 8)}`}
                                  {prod.authorOrPublisher && ` • By ${prod.authorOrPublisher}`}
                                </div>
                                <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                                  /store/{prod.slug || generateProductSlug(prod.name)}
                                </div>
                                {prod.hasVariants && prod.variants && prod.variants.length > 0 && (
                                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      <Layers className="w-2.5 h-2.5" />
                                      {prod.variants.length} Variant{prod.variants.length === 1 ? '' : 's'}
                                    </span>
                                    {prod.variantOptions && prod.variantOptions.length > 0 && (
                                      <span className="text-[9px] text-slate-400 font-medium">
                                        ({prod.variantOptions.map((o) => o.name).join(', ')})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category & Type */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1 mb-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {prod.categoryName || prod.category}
                              </span>
                              {prod.subCategory && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {prod.subCategory}
                                </span>
                              )}
                              {prod.paymentMethods === 'cod' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title="Restricted to Cash on Delivery">
                                  COD Only
                                </span>
                              )}
                              {prod.paymentMethods === 'razorpay' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200" title="Restricted to Online Payment">
                                  Online Only
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 capitalize">
                              {PRODUCT_TYPE_LABELS[prod.productType] || prod.productType}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-slate-900">₹{prod.price.toLocaleString('en-IN')}</div>
                            {prod.mrp && prod.mrp > prod.price && (
                              <div className="text-[10px] text-slate-400 line-through">
                                ₹{prod.mrp.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>

                          {/* Availability & Inventory */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleAvailable(prod)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer shadow-2xs ${
                                  prod.isAvailable === false || prod.availability === 'unavailable' || prod.availability === 'out_of_stock'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                                    : prod.availability === 'pre_order'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                    : prod.availability === 'discontinued'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={
                                  prod.isAvailable === false || prod.availability === 'unavailable' || prod.availability === 'out_of_stock'
                                    ? 'Currently marked Unavailable. Click to switch to Available.'
                                    : 'Currently marked Available. Click to switch to Unavailable.'
                                }
                              >
                                {prod.isAvailable === false || prod.availability === 'unavailable'
                                  ? 'Unavailable'
                                  : prod.availability === 'out_of_stock'
                                  ? 'Out of Stock'
                                  : prod.availability === 'pre_order'
                                  ? 'Pre-Order'
                                  : prod.availability === 'discontinued'
                                  ? 'Discontinued'
                                  : 'Available'}
                              </button>

                              {/* Stock Tracking Count */}
                              {prod.trackInventory === false || prod.productType === 'digital' ? (
                                <span className="text-[9px] text-slate-400 font-medium">Unlimited</span>
                              ) : prod.stockCount !== undefined ? (
                                prod.stockCount <= (prod.lowStockThreshold ?? 5) && prod.stockCount > 0 ? (
                                  <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Low Stock: {prod.stockCount}
                                  </span>
                                ) : prod.stockCount === 0 ? (
                                  <span className="text-[9px] text-rose-600 font-bold">0 in stock</span>
                                ) : (
                                  <span className="text-[9px] text-slate-500 font-medium">{prod.stockCount} in stock</span>
                                )
                              ) : null}
                            </div>
                          </td>

                          {/* Active / Inactive Status */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleActive(prod)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                                isArchived
                                  ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                  : isActive
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
                              }`}
                              title={isActive ? 'Click to Deactivate' : 'Click to Activate'}
                            >
                              <Power className="w-2.5 h-2.5" />
                              <span>{isArchived ? 'Archived' : isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Live Catalog Publish Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleTogglePublish(prod)}
                              disabled={isArchived}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer shadow-2xs ${
                                isArchived
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : prod.isPublished
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
                              }`}
                              title={prod.isPublished ? 'Click to Unpublish' : 'Click to Publish Live'}
                            >
                              {prod.isPublished ? (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-600" /> Published
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-slate-400" /> Draft
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Product Modal */}
                              <button
                                onClick={() => setPreviewProduct(prod)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="View Product Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Product */}
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Safe Delete / Archive */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleOpenDeleteModal(prod)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                                  title="Archive / Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CATEGORY TAXONOMY */}
      {/* ============================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Category Classification Hierarchy</h3>
                <p className="text-xs text-slate-500">Organize publications, curriculum textbooks, and institutional resources</p>
              </div>

              <div className="flex items-center gap-2">
                {categories.length === 0 && (
                  <button
                    onClick={handleSeedStandardCategories}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Provision Standard Categories
                  </button>
                )}
                <button
                  onClick={handleOpenAddCategory}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Tag className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">No custom categories provisioned yet.</p>
                <p className="text-[11px] text-slate-500">Click "Provision Standard Categories" to bootstrap default classifications.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const linkedCount = products.filter(
                    (p) => p.category === cat.slug || p.category === cat.id || p.category === cat.name
                  ).length;

                  return (
                    <div key={cat.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                            {(cat.isCore || cat.slug === 'books') && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                Core Category
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryActive(cat)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              cat.isActive !== false
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Click to toggle active state"
                          >
                            {cat.isActive !== false ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Slug: {cat.slug}
                        </span>
                        {cat.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cat.subcategories.map((sc, i) => (
                              <span key={i} className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                                {sc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">
                          <strong className="text-slate-800">{linkedCount}</strong> product(s) linked
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCatName(cat.name);
                              setCatSlug(cat.slug);
                              setCatDesc(cat.description || '');
                              setCatSubcategories((cat.subcategories || []).join(', '));
                              setCatIsCore(Boolean(cat.isCore || cat.slug === 'books'));
                              setCatIsActive(cat.isActive !== false);
                              setIsCategoryModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRequestDeleteCategory(cat)}
                              disabled={Boolean(cat.isCore || cat.slug === 'books')}
                              className={`p-1.5 rounded transition-colors ${
                                cat.isCore || cat.slug === 'books'
                                  ? 'opacity-30 text-slate-400 cursor-not-allowed'
                                  : 'hover:bg-rose-50 text-rose-600 cursor-pointer'
                              }`}
                              title={cat.isCore || cat.slug === 'books' ? 'Books is a mandatory core category and cannot be deleted' : 'Delete Category'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: STORE ARCHITECTURE CONSTITUTION */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              FET Store Architecture Constitution (Task 2: Product & Category Management)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900">1. Modular Ecosystem Integration</h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                The FET Store functions as a native, modular component of FET India. It utilizes the unified Firebase Firestore backend without duplicate databases or external API dependencies.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900">2. Strict Product Visibility Enforcement</h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Only products marked as <span className="font-mono text-emerald-800">isPublished: true</span> AND <span className="font-mono text-emerald-800">status: ACTIVE</span> are rendered in the public catalog. Inactive and draft items are strictly sequestered for authorized administrative management.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900">3. Safe Deletion & Data Retention</h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Product deletion supports safe archiving (soft-delete) to ensure historical audit trails, future orders, and accounting references remain intact. Categories with linked products cannot be deleted.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900">4. Super Admin RBAC Governance</h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Creation, modification, and deletion of products and categories are guarded by Firestore Security Rules for <span className="font-mono text-indigo-700">super_admin</span>, <span className="font-mono text-indigo-700">store_admin</span>, and <span className="font-mono text-indigo-700">store_manager</span> roles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: STORE CUSTOMER ORDERS FOUNDATION (Task 14) */}
      {/* ============================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Orders KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Orders
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">{orderMetrics.total}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Recorded order drafts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                Drafts
              </span>
              <div className="text-xl font-black text-amber-700 mt-1">{orderMetrics.drafts}</div>
              <span className="text-[10px] text-amber-800 mt-0.5 block">Awaiting payment phase</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Processing / Paid
              </span>
              <div className="text-xl font-black text-blue-700 mt-1">{orderMetrics.processing}</div>
              <span className="text-[10px] text-blue-800 mt-0.5 block">Fulfillment pipeline</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                Delivered
              </span>
              <div className="text-xl font-black text-emerald-700 mt-1">{orderMetrics.delivered}</div>
              <span className="text-[10px] text-emerald-800 mt-0.5 block">Completed dispatches</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                Total Pipeline Value
              </span>
              <div className="text-xl font-black text-purple-700 mt-1">
                ₹{orderMetrics.totalRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-purple-800 mt-0.5 block">Authoritative value</span>
            </div>
          </div>

          {/* Orders Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                placeholder="Search orders by Order #, customer name, mobile, email..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
              </div>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses ({orders.length})</option>
                <option value="draft">Draft ({orderMetrics.drafts})</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered ({orderMetrics.delivered})</option>
                <option value="cancelled">Cancelled ({orderMetrics.cancelled})</option>
                <option value="refunded">Refunded ({orderMetrics.refunded})</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold shrink-0 ml-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date:</span>
              </div>
              <select
                value={orderDateFilter}
                onChange={(e) => setOrderDateFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {isOrdersLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span>Loading authoritative store orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Store Orders Found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {orderSearchTerm || orderStatusFilter !== 'all'
                      ? 'No orders match your filter criteria. Try resetting the search or status filter.'
                      : 'When customers proceed to checkout from the FET Store, order drafts will appear here for administrative verification and fulfillment.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4 text-right">Total (INR)</th>
                      <th className="py-3 px-4 text-center">Order Status</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => {
                      const statusColor =
                        ord.orderStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : ord.orderStatus === 'cancelled'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : ord.orderStatus === 'refunded'
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : ord.orderStatus === 'processing' || ord.orderStatus === 'shipped' || ord.orderStatus === 'paid'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300';

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">
                              {ord.customer?.fullName || 'Anonymous'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {ord.customer?.mobileNumber} • {ord.customer?.email}
                            </div>
                            {ord.educationalInstitutionalOrder && (
                              <div className="text-[10px] text-indigo-700 font-medium mt-0.5">
                                Inst: {ord.institutionName || 'Institutional'}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-700">
                              {ord.itemCount || ord.items?.length || 0} item(s)
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {ord.items?.map(i => i.productName).join(', ')}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            ₹{(ord.total || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColor}`}>
                              {ord.orderStatus?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              ord.paymentStatus === 'captured' || ord.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {ord.paymentStatus || 'unpaid'}
                            </span>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {ord.paymentMethod === 'COD' ? 'Cash on Delivery' : ord.paymentMethod === 'razorpay' ? 'Razorpay' : ord.paymentMethod || 'Online'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(ord);
                                setNewOrderStatus(ord.orderStatus);
                                setOrderStatusNote('');
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Review Order
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ORDER DETAILS & STATUS WORKFLOW (Task 14) */}
      {/* ============================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in my-8 text-slate-800">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Order Details: {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Created on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Customer & Destination Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Customer Reference</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{selectedOrder.customer?.fullName}</div>
                  <div className="text-slate-600">{selectedOrder.customer?.email}</div>
                  <div className="text-slate-600">{selectedOrder.customer?.mobileNumber}</div>
                  {selectedOrder.customer?.membershipId && (
                    <div className="text-[11px] font-mono text-emerald-700 mt-1">
                      Member ID: {selectedOrder.customer.membershipId}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    User UID: {selectedOrder.userId}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fulfillment / Delivery Address</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedOrder.shippingAddress?.addressLine1 || selectedOrder.billingAddress?.addressLine1}
                    {selectedOrder.shippingAddress?.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                    <br />
                    {selectedOrder.shippingAddress?.city || selectedOrder.billingAddress?.city}, {selectedOrder.shippingAddress?.state || selectedOrder.billingAddress?.state} - {selectedOrder.shippingAddress?.pincode || selectedOrder.billingAddress?.pincode}
                    <br />
                    <span className="text-[11px] text-slate-500 font-bold">Country: India</span>
                  </p>
                  {selectedOrder.deliveryNotes && (
                    <div className="pt-1.5 border-t border-slate-200 text-[11px] text-amber-900">
                      <strong>Delivery Notes:</strong> {selectedOrder.deliveryNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Institutional Details (If applicable) */}
              {selectedOrder.educationalInstitutionalOrder && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Educational Institutional Order Record</span>
                  </div>
                  <p>Institution: <strong>{selectedOrder.institutionName}</strong></p>
                  {selectedOrder.scholarshipRollNumber && (
                    <p>Student / Roll Number: <span className="font-mono">{selectedOrder.scholarshipRollNumber}</span></p>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 text-xs border-b border-slate-200 flex justify-between">
                  <span>Ordered Catalog Items ({selectedOrder.items?.length || 0})</span>
                  <span>Total (INR)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{it.productName}</div>
                        {it.variantName && (
                          <div className="text-[11px] text-indigo-700">Variant: {it.variantName}</div>
                        )}
                        <div className="text-[11px] text-slate-500">
                          Qty: {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}
                          {it.sku && <span className="ml-2 font-mono text-[10px]">({it.sku})</span>}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        ₹{it.itemTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1 text-right">
                  <div className="text-slate-600">Subtotal: ₹{selectedOrder.subtotal?.toLocaleString('en-IN')}</div>
                  <div className="text-slate-600">Shipping: ₹{selectedOrder.shippingAmount || 0} (Phase 2 Placeholder)</div>
                  <div className="text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    Grand Total: ₹{selectedOrder.total?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Payment Details Card & Staff Collection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Payment Information</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    selectedOrder.paymentStatus === 'captured' || selectedOrder.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {selectedOrder.paymentStatus || 'unpaid'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Payment Method</span>
                    <span className="font-bold text-slate-900">
                      {selectedOrder.paymentMethodLabel || (selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay Online Payment' : selectedOrder.paymentMethod || 'Online')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Amount</span>
                    <span className="font-bold text-slate-900">
                      ₹{(selectedOrder.total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedOrder.razorpayPaymentId && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase">Razorpay Payment ID</span>
                      <span className="font-mono text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                        {selectedOrder.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                  {selectedOrder.paidAt && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase">Payment Verified At</span>
                      <span className="text-slate-700 font-medium">
                        {new Date(selectedOrder.paidAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* For COD orders that are unpaid, allow authorized staff to record cash collection */}
                {selectedOrder.paymentMethod === 'COD' && selectedOrder.paymentStatus !== 'captured' && selectedOrder.paymentStatus !== 'paid' && (
                  <div className="pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-900">
                      Cash on Delivery: Awaiting physical collection of <strong>₹{(selectedOrder.total || 0).toLocaleString('en-IN')}</strong>.
                    </div>
                    <button
                      type="button"
                      onClick={handleRecordCodPayment}
                      disabled={isRecordingPayment}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isRecordingPayment ? 'Recording...' : 'Record Cash Collection'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Order Status Advancement Control */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Advance Order Processing Status</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 uppercase tracking-wider">
                    Current: {selectedOrder.orderStatus}
                  </span>
                </div>

                {availableNextStatuses.length === 0 ? (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      Order <strong>{selectedOrder.orderNumber}</strong> has reached terminal status (<strong>{selectedOrder.orderStatus}</strong>). No further status advancement permitted.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Permitted Next Status *
                        </label>
                        <select
                          value={newOrderStatus}
                          onChange={(e) => setNewOrderStatus(e.target.value as StoreOrderStatus)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="">-- Select Permitted Status --</option>
                          {availableNextStatuses.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Audit Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={orderStatusNote}
                          onChange={(e) => setOrderStatusNote(e.target.value)}
                          placeholder="e.g. Verified by Store Manager and packed"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleUpdateOrderStatus}
                        disabled={isUpdatingOrderStatus || !newOrderStatus || newOrderStatus === selectedOrder.orderStatus}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {isUpdatingOrderStatus ? 'Updating...' : 'Save Status & Log Audit'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Status History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-700 block">Status Audit History</span>
                  <div className="space-y-1.5">
                    {selectedOrder.statusHistory.map((h, i) => (
                      <div key={i} className="text-[11px] text-slate-600 flex items-start justify-between">
                        <span>
                          <strong className="capitalize">{h.status?.replace('_', ' ')}</strong>
                          {h.note && <span className="text-slate-500"> — {h.note}</span>}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-2">
                          {new Date(h.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immutable Record Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Audit Compliance:</strong> Order records cannot be deleted. All transactions remain permanently archived for statutory financial compliance.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SMART CATEGORY-BASED PRODUCT UPLOAD / EDIT MODAL (Task 29) */}
      {/* ============================================================== */}
      <AdminProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        categories={
          categories.length > 0
            ? categories
            : DEFAULT_CATEGORIES.map((c, i) => ({
                id: `default-${c.slug || i}`,
                ...c,
                isActive: true,
                createdAt: '',
                updatedAt: ''
              }))
        }
        allProducts={products}
        onSave={handleSaveProductFromModal}
        isSubmitting={formSubmitting}
        error={formError}
        onNotify={showToast}
      />

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ============================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-black">
                  {editingCategory ? 'Edit Store Category' : 'Add Store Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Scholastic Literature"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">URL Slug (Optional)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. scholastic-literature"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Classification scope..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Subcategories */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">Subcategories (comma-separated)</label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={catSubcategories}
                  onChange={(e) => setCatSubcategories(e.target.value)}
                  placeholder="e.g. Islamic Books, Educational Books, Children's Books"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Define subcategories for this classification to organize product listings.
                </span>
              </div>

              {catIsCore && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Mandatory Core Store Category (Protected against deletion)</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-800">Category Active</span>
                <input
                  type="checkbox"
                  checked={catIsActive}
                  onChange={(e) => setCatIsActive(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  {catSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SAFE DELETE / ARCHIVE PRODUCT */}
      {/* ============================================================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Manage Product Removal</h3>
              <p className="text-xs text-slate-600 mt-1">
                Choose a removal option for <strong className="text-slate-900">"{deletingProduct.name}"</strong>:
              </p>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <label
                onClick={() => setDeleteMode('archive')}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  deleteMode === 'archive'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Archive className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Archive Product (Recommended)</span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Hides the product from the public store and marks it as decommissioned. Historical audit trails, inventory records, and future transaction references are safely preserved.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setDeleteMode('permanent')}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  deleteMode === 'permanent'
                    ? 'border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Trash2 className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Permanent Hard Delete</span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Permanently purges the product document from the database. Use only if this product was created accidentally and has zero transaction history.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProductDelete}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer ${
                  deleteMode === 'archive'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {deleteMode === 'archive' ? 'Confirm Archive' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SAFE CATEGORY DELETION CHECK */}
      {/* ============================================================== */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              categoryDepWarning ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              {categoryDepWarning ? <AlertTriangle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                {categoryDepWarning ? 'Category Dependency Protected' : 'Delete Category?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {categoryDepWarning || `Are you sure you want to delete category "${categoryToDelete.name}"? No products currently depend on it.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCategoryToDelete(null);
                  setCategoryDepWarning(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              {!categoryDepWarning && (
                <button
                  type="button"
                  onClick={handleConfirmCategoryDelete}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PRODUCT DETAIL PREVIEW */}
      {/* ============================================================== */}
      {previewProduct && (
        <ProductDetailModal
          product={previewProduct}
          isOpen={Boolean(previewProduct)}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </div>
  );
};
