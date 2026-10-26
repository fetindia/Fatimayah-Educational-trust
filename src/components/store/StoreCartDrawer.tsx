/**
 * @license
 * Store Cart Drawer (Store Task 13: Shopping Cart & Purchase Intent Foundation)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides an official, accessible slide-out cart drawer showing:
 * - Cart item count and status
 * - Selected product variants (size, edition, volume)
 * - Individual and subtotal price calculations
 * - Quantity modifiers (increment, decrement, remove)
 * - Availability validation warning tags
 * - Transparent Educational & Welfare connection notice
 * - Clear disclaimer that online payment and final order placement are reserved for upcoming Task 14
 */

import React from 'react';
import {
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Package,
  HeartHandshake,
  Clock,
  Sparkles
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface StoreCartDrawerProps {
  onOpenStore?: () => void;
  onOpenContact?: () => void;
  onOpenDonate?: () => void;
  onProceedToCheckout?: () => void;
}

export const StoreCartDrawer: React.FC<StoreCartDrawerProps> = ({
  onOpenStore,
  onOpenContact,
  onOpenDonate,
  onProceedToCheckout
}) => {
  const {
    cart,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const hasCodOnly = cart.items.some(i => i.paymentMethods === 'cod');
  const hasPrepaidOnly = cart.items.some(i => i.paymentMethods === 'razorpay');
  const hasPaymentConflict = hasCodOnly && hasPrepaidOnly;

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" id="fet-store-cart-drawer">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeCartDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight">Your FET Store Cart</h3>
                <p className="text-[11px] text-slate-300">
                  {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <button
              onClick={closeCartDrawer}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Items List or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-800">Your Cart is Empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Explore prescribed books, modest wear, attars, and educational materials in the FET India catalogue.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeCartDrawer();
                    if (onOpenStore) onOpenStore();
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Browse Catalogue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                  <span>Selected Products</span>
                  <button
                    onClick={clearCart}
                    className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {cart.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex gap-3 shadow-2xs"
                  >
                    {/* Item Image */}
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="text-xs font-black text-slate-900 truncate">
                          {item.productName}
                        </h5>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant Badge */}
                      {item.selectedVariant && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.selectedVariant.name}
                        </span>
                      )}

                      {/* Demo item notice */}
                      {item.isDemo && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 ml-1">
                          Test Item
                        </span>
                      )}

                      {/* Payment Method Badge */}
                      {item.paymentMethods === 'cod' && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 ml-1">
                          COD Only
                        </span>
                      )}
                      {item.paymentMethods === 'razorpay' && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200 ml-1">
                          Prepaid Only
                        </span>
                      )}

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[11px] text-slate-400 ml-1">
                              (₹{(item.price * item.quantity).toLocaleString('en-IN')} total)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-slate-900 w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            disabled={Boolean(item.maxQuantity && item.quantity >= item.maxQuantity)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Educational & Welfare Transparency Box */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Subsidized Educational Mission</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Trust educational supplies and modest garments are subsidized through statutory welfare allocations to support students and madrasa scholars across India.
              </p>
            </div>
          </div>

          {/* Footer: Subtotal & Future Checkout Phase Notice */}
          {cart.items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{cart.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Taxes & Shipping</span>
                  <span className="text-slate-400 font-medium">Calculated at final order</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
                  <span>Total Estimated</span>
                  <span className="text-lg text-emerald-800">
                    ₹{cart.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method Conflict Warning */}
              {hasPaymentConflict && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Conflicting Payment Requirements</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Your cart contains both Cash on Delivery only items and Online Payment only items. Please remove one or place separate orders for each.
                  </p>
                </div>
              )}

              {/* Single Payment Method Info Notice */}
              {!hasPaymentConflict && hasCodOnly && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Cart contains Cash on Delivery only products. Order will be placed via COD.</span>
                </div>
              )}

              {!hasPaymentConflict && hasPrepaidOnly && (
                <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>Cart contains prepaid items. Order requires Online Payment (Razorpay/UPI).</span>
                </div>
              )}

              {/* Checkout Preparation Action */}
              <button
                onClick={() => {
                  if (hasPaymentConflict) return;
                  closeCartDrawer();
                  if (onProceedToCheckout) {
                    onProceedToCheckout();
                  }
                }}
                disabled={hasPaymentConflict}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>{hasPaymentConflict ? 'Resolve Payment Conflict' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {onOpenContact && (
                  <button
                    onClick={() => {
                      closeCartDrawer();
                      onOpenContact();
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Institutional Order Desk
                  </button>
                )}
                <button
                  onClick={closeCartDrawer}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
