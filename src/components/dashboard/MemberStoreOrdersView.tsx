/**
 * @license
 * Member Store Orders View (Store Task 15)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Customer-facing order tracking component allowing members to:
 * - View only their own authenticated store orders in real time
 * - Inspect line items, selected variants, quantities, prices, and addresses
 * - Track fulfillment pipeline progress (Draft -> Processing -> Shipped -> Delivered)
 * - Cancel pending order drafts prior to dispatch
 * - Print authoritative order receipts
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Calendar,
  X,
  Printer,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Ban,
  Search,
  Filter,
  Lock,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StoreOrder, StoreOrderStatus } from '../../types';
import { subscribeToUserStoreOrders, updateStoreOrderStatus } from '../../lib/firebase';

interface MemberStoreOrdersViewProps {
  onOpenStore?: () => void;
  onOpenAuth?: () => void;
  standaloneInStore?: boolean;
}

export const MemberStoreOrdersView: React.FC<MemberStoreOrdersViewProps> = ({
  onOpenStore,
  onOpenAuth,
  standaloneInStore = false
}) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [cancelErrorMsg, setCancelErrorMsg] = useState<string | null>(null);

  // Pagination & Filtering State (Store Task 16)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Real-time subscription to authenticated user's store orders
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToUserStoreOrders(
      currentUser.uid,
      (orderList) => {
        setOrders(orderList);
        setIsLoading(false);
        // If an order is currently selected in modal, keep its state synchronized
        setSelectedOrder((prev) => {
          if (!prev) return null;
          return orderList.find((o) => o.id === prev.id) || prev;
        });
      },
      (err) => {
        console.warn('Subscription error for user store orders:', err);
        setError('Failed to load your store orders. Please try again.');
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Handle customer cancelling their own pending order draft
  const handleCancelOrder = async (orderId: string) => {
    if (!currentUser || !selectedOrder) return;

    setIsCancelling(true);
    setCancelSuccessMsg(null);
    setCancelErrorMsg(null);
    try {
      await updateStoreOrderStatus(
        orderId,
        'cancelled',
        'Order draft cancelled by customer',
        {
          uid: currentUser.uid,
          email: currentUser.email || 'customer@fetindia.org',
          role: 'customer'
        }
      );
      setCancelSuccessMsg('Your order draft has been cancelled successfully.');
      setShowCancelConfirm(false);
    } catch (err: any) {
      setCancelErrorMsg(err?.message || 'Failed to cancel order draft. Please contact trust administration.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setCancelSuccessMsg(null);
    setCancelErrorMsg(null);
    setShowCancelConfirm(false);
  };

  // Status Badge Helper
  const getStatusBadge = (status: StoreOrderStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" />
            Draft Order
          </span>
        );
      case 'pending_payment':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" />
            Pending Payment
          </span>
        );
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Paid & Confirmed
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
            <Package className="w-3 h-3 text-blue-700" />
            Processing & Packing
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 inline-flex items-center gap-1">
            <Truck className="w-3 h-3 text-indigo-700" />
            Dispatched / In Transit
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
            <Ban className="w-3 h-3 text-rose-700" />
            Cancelled
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-slate-600" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Customer Privacy Protection Helpers (Task 16)
  const maskPhone = (num?: string) => {
    if (!num) return 'Not recorded';
    const digits = num.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `${digits.slice(0, 2)}••••••${digits.slice(-2)}`;
    }
    return num;
  };

  const maskEmail = (em?: string) => {
    if (!em || !em.includes('@')) return em || 'Not recorded';
    const [name, domain] = em.split('@');
    if (name.length <= 2) return `${name[0]}•@${domain}`;
    return `${name.slice(0, 2)}••••${name.slice(-1)}@${domain}`;
  };

  // Filtered & Paginated Orders (Task 16)
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          if (!['draft', 'pending_payment', 'paid', 'processing', 'shipped'].includes(ord.orderStatus)) return false;
        } else if (statusFilter === 'completed') {
          if (ord.orderStatus !== 'delivered') return false;
        } else if (statusFilter === 'cancelled') {
          if (ord.orderStatus !== 'cancelled') return false;
        } else if (statusFilter === 'refunded') {
          if (ord.orderStatus !== 'refunded') return false;
        } else if (ord.orderStatus !== statusFilter) {
          return false;
        }
      }

      // 2. Search Query Filter (Order number, id, or item name)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const numMatch = ord.orderNumber?.toLowerCase().includes(q) || ord.id?.toLowerCase().includes(q);
        const itemMatch = ord.items?.some(i => i.productName?.toLowerCase().includes(q) || i.variantName?.toLowerCase().includes(q));
        if (!numMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, effectivePage, pageSize]);

  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus === 'draft' || o.orderStatus === 'pending_payment' || o.orderStatus === 'processing' || o.orderStatus === 'shipped'
  ).length;

  const deliveredOrdersCount = orders.filter((o) => o.orderStatus === 'delivered').length;

  // Unauthenticated State (Task 16: Authentication strictly required for order history)
  if (!currentUser) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-8" id="member-store-orders-view">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Sign In to View Your Store Orders</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Order history, purchase details, and live fulfillment tracking are protected personal records. Please authenticate with your FET India account to view your past orders.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
            {onOpenStore && (
              <button
                type="button"
                onClick={onOpenStore}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Back to Store Catalogue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="member-store-orders-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl text-white shadow-md border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">My Store Orders & Allocations</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official FET Store
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Track official educational supplies, religious publications, and modest apparel ordered through the trust store.
            </p>
          </div>
        </div>

        {onOpenStore && (
          <button
            onClick={onOpenStore}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm self-start md:self-auto cursor-pointer"
          >
            <span>Browse FET Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Orders Placed
          </span>
          <div className="text-xl font-black text-slate-900 mt-1">{orders.length}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Official order references</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            Active / In Transit
          </span>
          <div className="text-xl font-black text-blue-700 mt-1">{activeOrdersCount}</div>
          <span className="text-[10px] text-blue-800 mt-0.5 block">Orders in preparation or transit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Completed Dispatches
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1">{deliveredOrdersCount}</div>
          <span className="text-[10px] text-emerald-800 mt-0.5 block">Delivered educational materials</span>
        </div>
      </div>

      {/* Search and Status Filters (Task 16) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Order # or item title..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({activeOrdersCount})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('completed'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Delivered ({deliveredOrdersCount})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('cancelled'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelled ({orders.filter(o => o.orderStatus === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading your store orders...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 px-4">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <div className="text-xs text-rose-800 font-bold">{error}</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-4">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-base font-bold text-slate-900">No Store Orders Yet</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You have not placed any orders from the FET Store yet. Discover subsidized syllabus books, modest prayer apparel, and madrasa learning kits.
              </p>
            </div>
            {onOpenStore && (
              <button
                onClick={onOpenStore}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Explore FET Store
              </button>
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No Orders Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No store orders match your search or filter criteria. Try clearing the search query or selecting "All".
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1); }}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Order ID & Date</th>
                    <th className="py-3.5 px-4">Items Summary</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono text-xs">
                          {ord.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-bold">
                          {ord.items?.[0]?.productName || 'Order Item'}
                          {ord.items && ord.items.length > 1 && (
                            <span className="text-slate-400 text-[11px] font-normal ml-1">
                              +{ord.items.length - 1} more
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ord.itemCount || ord.items?.reduce((acc, i) => acc + i.quantity, 0) || 1} units total
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{ord.total?.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {ord.paymentMethod === 'COD' ? 'Cash on Delivery' : ord.paymentMethod === 'razorpay' ? 'Razorpay' : ord.paymentMethod || 'Online'} • <span className={`uppercase font-bold ${
                            ord.paymentStatus === 'captured' || ord.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                          }`}>{ord.paymentStatus || 'unpaid'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(ord.orderStatus)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setCancelSuccessMsg(null);
                            setCancelErrorMsg(null);
                            setShowCancelConfirm(false);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar (Task 16: Support pagination or efficient loading) */}
            {filteredOrders.length > pageSize && (
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Showing <strong className="text-slate-700">{(effectivePage - 1) * pageSize + 1}</strong> to <strong className="text-slate-700">{Math.min(effectivePage * pageSize, filteredOrders.length)}</strong> of <strong className="text-slate-700">{filteredOrders.length}</strong> orders
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={effectivePage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <span className="px-2.5 py-1 text-slate-600 font-bold text-[11px]">
                    Page {effectivePage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={effectivePage >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base">Order Particulars</h3>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                    {selectedOrder.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {cancelSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{cancelSuccessMsg}</span>
                </div>
              )}

              {cancelErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cancelErrorMsg}</span>
                </div>
              )}

              {/* Status & Pipeline Tracker */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Fulfillment Pipeline</span>
                  {getStatusBadge(selectedOrder.orderStatus)}
                </div>

                {/* Progress Pipeline Stepper */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className={`p-2 rounded-xl text-center border text-[10px] font-bold ${
                    ['draft', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered'].includes(selectedOrder.orderStatus)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    1. Draft / Placed
                  </div>

                  <div className={`p-2 rounded-xl text-center border text-[10px] font-bold ${
                    ['paid', 'processing', 'shipped', 'delivered'].includes(selectedOrder.orderStatus)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : (selectedOrder.orderStatus === 'pending_payment'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400')
                  }`}>
                    2. Confirmed
                  </div>

                  <div className={`p-2 rounded-xl text-center border text-[10px] font-bold ${
                    ['shipped', 'delivered'].includes(selectedOrder.orderStatus)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : (selectedOrder.orderStatus === 'processing'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400')
                  }`}>
                    3. In Transit
                  </div>

                  <div className={`p-2 rounded-xl text-center border text-[10px] font-bold ${
                    selectedOrder.orderStatus === 'delivered'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    4. Delivered
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-700 text-xs border-b border-slate-200 flex justify-between">
                  <span>Ordered Catalog Items ({selectedOrder.items?.length || 0})</span>
                  <span>Total (INR)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{it.productName}</div>
                        {it.variantName && (
                          <div className="text-[11px] text-emerald-800">Option: {it.variantName}</div>
                        )}
                        <div className="text-[11px] text-slate-500">
                          Quantity: {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}
                          {it.sku && <span className="ml-2 font-mono text-[10px] text-slate-400">({it.sku})</span>}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        ₹{it.itemTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-1 text-right">
                  <div className="text-slate-600">Items Subtotal: ₹{selectedOrder.subtotal?.toLocaleString('en-IN')}</div>
                  <div className="text-slate-600">Standard Shipping: ₹{selectedOrder.shippingAmount || 0}</div>
                  <div className="text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                    Grand Total: ₹{selectedOrder.total?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">
                      {selectedOrder.paymentMethodLabel || (selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay Online Payment' : selectedOrder.paymentMethod || 'Online')}
                    </span>
                    {selectedOrder.razorpayPaymentId && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Payment Ref: {selectedOrder.razorpayPaymentId}
                      </div>
                    )}
                    {selectedOrder.paymentMethod === 'COD' && selectedOrder.paymentStatus !== 'captured' && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Please pay ₹{(selectedOrder.total || 0).toLocaleString('en-IN')} in cash upon delivery.
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-500 font-medium">Payment Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    selectedOrder.paymentStatus === 'captured' || selectedOrder.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {selectedOrder.paymentStatus || 'unpaid'}
                  </span>
                </div>
              </div>

              {/* Delivery and Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="font-bold text-slate-700 block">Delivery Address</span>
                  <div className="text-slate-600 space-y-0.5">
                    <div>{selectedOrder.shippingAddress?.addressLine1}</div>
                    {selectedOrder.shippingAddress?.addressLine2 && (
                      <div>{selectedOrder.shippingAddress.addressLine2}</div>
                    )}
                    <div>
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                    </div>
                    <div>{selectedOrder.shippingAddress?.country || 'India'}</div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 block">Recipient Particulars</span>
                    <span className="text-[10px] text-emerald-800 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      Privacy Protected
                    </span>
                  </div>
                  <div className="text-slate-600 space-y-0.5">
                    <div className="font-bold text-slate-900">{selectedOrder.customer?.fullName}</div>
                    <div>Phone: <span className="font-mono text-[11px] text-slate-700">{maskPhone(selectedOrder.customer?.mobileNumber)}</span></div>
                    <div>Email: <span className="font-mono text-[11px] text-slate-700">{maskEmail(selectedOrder.customer?.email)}</span></div>
                    {selectedOrder.customer?.membershipId && (
                      <div className="text-emerald-800 font-mono text-[11px]">Member ID: {selectedOrder.customer.membershipId}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-700 block">Order History & Audit Log</span>
                  <div className="space-y-1.5 divide-y divide-slate-100">
                    {selectedOrder.statusHistory.map((h, i) => (
                      <div key={i} className="pt-1.5 text-[11px] text-slate-600 flex items-start justify-between">
                        <div>
                          <span className="font-bold uppercase tracking-wider text-slate-800">{h.status}:</span>{' '}
                          <span>{h.note || 'Status updated'}</span>
                        </div>
                        <span className="text-slate-400 shrink-0 ml-2 font-mono text-[10px]">
                          {new Date(h.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                {(selectedOrder.orderStatus === 'draft' || selectedOrder.orderStatus === 'pending_payment') && (
                  showCancelConfirm ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-rose-700">Cancel this draft order?</span>
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        disabled={isCancelling}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel Draft'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                      >
                        Keep Order
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelConfirm(true);
                        setCancelErrorMsg(null);
                      }}
                      disabled={isCancelling}
                      className="px-4 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{isCancelling ? 'Cancelling...' : 'Cancel Order Draft'}</span>
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
