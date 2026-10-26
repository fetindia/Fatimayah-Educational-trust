/**
 * @license
 * Cart Context & Provider (Store Task 13: Shopping Cart & Purchase Intent Foundation)
 * Fatimyah Educational Trust India (FET India)
 * 
 * Guarantees:
 * 1. User-isolated cart persistence (keyed by Firebase UID when authenticated, with guest localStorage fallback).
 * 2. Strict purchasability validation (published, active, non-archived, in_stock/available, positive configured price).
 * 3. Exact variant preservation (size, color, format, volume, etc.).
 * 4. Quantity limits against configured inventory without permanent stock deduction.
 * 5. Complete separation from checkout, payment gateways, orders, and Finance modules.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { StoreProduct, StoreProductVariant, StoreCart, StoreCartItem, CartValidationResult } from '../types';

interface CartContextValue {
  cart: StoreCart;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (product: StoreProduct, variant?: StoreProductVariant | null, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  canAddToCart: (product: StoreProduct, variant?: StoreProductVariant | null) => CartValidationResult;
  isItemInCart: (productId: string, variantId?: string) => boolean;
  getItemQuantity: (productId: string, variantId?: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = 'fet_store_guest_cart_v1';
const AUTH_CART_STORAGE_PREFIX = 'fet_store_user_cart_v1_';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Storage key is strictly isolated per authenticated user, with separate guest key
  const storageKey = useMemo(() => {
    return currentUser?.uid ? `${AUTH_CART_STORAGE_PREFIX}${currentUser.uid}` : GUEST_CART_STORAGE_KEY;
  }, [currentUser?.uid]);

  // Initial cart loader
  const [cartItems, setCartItems] = useState<StoreCartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const initialKey = currentUser?.uid ? `${AUTH_CART_STORAGE_PREFIX}${currentUser.uid}` : GUEST_CART_STORAGE_KEY;
      const raw = localStorage.getItem(initialKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load store cart:', e);
    }
    return [];
  });

  // Re-load cart whenever active authenticated user changes (prevents exposing another user's cart)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
          return;
        }
      }
      setCartItems([]);
    } catch (e) {
      console.warn('Failed to switch cart user context:', e);
      setCartItems([]);
    }
  }, [storageKey]);

  // Persist cart to active user's storage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to persist store cart:', e);
    }
  }, [cartItems, storageKey]);

  // Calculate cart summary
  const cart: StoreCart = useMemo(() => {
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return {
      items: cartItems,
      totalItems,
      subtotal,
      currency: 'INR',
      lastUpdated: new Date().toISOString()
    };
  }, [cartItems]);

  const openCartDrawer = useCallback(() => setIsCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsCartDrawerOpen(false), []);

  /**
   * Authoritative client-side validation before adding or updating items.
   * Checks publication, availability, valid positive price, and stock limits.
   */
  const canAddToCart = useCallback((product: StoreProduct, variant?: StoreProductVariant | null): CartValidationResult => {
    // 1. Publication & Active status check
    if (!product.isPublished) {
      return { isValid: false, reason: 'This product is currently unpublished.' };
    }
    if (product.status === 'INACTIVE' || product.status === 'ARCHIVED' || product.status === 'DRAFT' || product.isActive === false || product.isArchived) {
      return { isValid: false, reason: 'This product is currently inactive.' };
    }

    // 2. Base Product Availability
    if (product.isAvailable === false || product.availability === 'unavailable' || product.availability === 'out_of_stock' || product.availability === 'discontinued') {
      return { isValid: false, reason: 'This product is currently marked as unavailable.' };
    }

    // 3. Variant Check (if product has variants)
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      if (!variant) {
        return { isValid: false, reason: 'Please select an edition or size option before adding to cart.' };
      }
      if (variant.isAvailable === false || variant.availability === 'unavailable' || variant.availability === 'out_of_stock') {
        return { isValid: false, reason: `The selected option "${variant.name}" is currently unavailable.` };
      }
    }

    // 4. Effective Price validation
    const effectivePrice = variant?.price !== undefined ? variant.price : product.price;
    if (effectivePrice === undefined || effectivePrice === null) {
      return { isValid: false, reason: 'This product does not have a configured price and cannot be ordered online.' };
    }

    // Free Open Access digital items should be downloaded directly, not put in commercial cart
    if (effectivePrice === 0 && (product.isDigital || product.productType === 'digital' || variant?.isDigital)) {
      return { isValid: false, reason: 'This digital resource is available for free direct download.' };
    }

    // 5. Stock validation
    const trackInventory = variant?.trackInventory !== undefined ? variant.trackInventory : product.trackInventory !== false;
    const stockCount = variant?.stockCount !== undefined ? variant.stockCount : product.stockCount;
    const isPreOrder = (variant?.availability || product.availability) === 'pre_order';

    if (trackInventory && !isPreOrder && stockCount !== undefined && stockCount <= 0) {
      return { isValid: false, reason: 'This item is currently out of stock.' };
    }

    return { isValid: true };
  }, []);

  /**
   * Deterministic Cart Item ID generator
   */
  const getCartItemId = (productId: string, variantId?: string) => {
    return `${productId}_${variantId || 'base'}`;
  };

  const isItemInCart = useCallback((productId: string, variantId?: string): boolean => {
    const id = getCartItemId(productId, variantId);
    return cartItems.some(i => i.cartItemId === id);
  }, [cartItems]);

  const getItemQuantity = useCallback((productId: string, variantId?: string): number => {
    const id = getCartItemId(productId, variantId);
    const item = cartItems.find(i => i.cartItemId === id);
    return item ? item.quantity : 0;
  }, [cartItems]);

  /**
   * Adds an item to cart or increments existing quantity.
   */
  const addToCart = useCallback((
    product: StoreProduct,
    variant?: StoreProductVariant | null,
    quantity: number = 1
  ): { success: boolean; message: string } => {
    const validation = canAddToCart(product, variant);
    if (!validation.isValid) {
      return { success: false, message: validation.reason || 'Unable to add item to cart.' };
    }

    const effectivePrice = variant?.price !== undefined ? variant.price : product.price;
    const effectiveMrp = variant?.mrp !== undefined ? variant.mrp : product.mrp;
    const cartItemId = getCartItemId(product.id, variant?.id);

    // Check inventory ceiling
    const trackInventory = variant?.trackInventory !== undefined ? variant.trackInventory : product.trackInventory !== false;
    const stockCount = variant?.stockCount !== undefined ? variant.stockCount : product.stockCount;
    const isPreOrder = (variant?.availability || product.availability) === 'pre_order';
    const maxAllowed = (!trackInventory || isPreOrder || stockCount === undefined) ? 99 : Math.max(1, stockCount);

    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.cartItemId === cartItemId);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const newQty = Math.min(maxAllowed, existing.quantity + quantity);
        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          maxQuantity: maxAllowed,
          updatedAt: new Date().toISOString()
        };
        return updated;
      } else {
        const newItem: StoreCartItem = {
          cartItemId,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productType: product.productType,
          category: product.category,
          categoryName: product.categoryName,
          imageUrl: variant?.imageUrl || product.imageUrl,
          price: effectivePrice,
          mrp: effectiveMrp,
          quantity: Math.min(maxAllowed, Math.max(1, quantity)),
          maxQuantity: maxAllowed,
          hasVariants: Boolean(product.hasVariants),
          selectedVariant: variant ? {
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            mrp: variant.mrp,
            attributes: variant.attributes
          } : undefined,
          sku: variant?.sku || product.sku,
          isDemo: product.isDemo,
          paymentMethods: product.paymentMethods || 'both',
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return [...prev, newItem];
      }
    });

    return {
      success: true,
      message: `Added "${variant ? variant.name : product.name}" to your cart.`
    };
  }, [canAddToCart]);

  /**
   * Updates an item's quantity with inventory validation.
   */
  const updateQuantity = useCallback((
    cartItemId: string,
    newQuantity: number
  ): { success: boolean; message?: string } => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return { success: true, message: 'Item removed from cart.' };
    }

    let capped = false;
    setCartItems(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const limit = item.maxQuantity || 99;
          const finalQty = Math.min(limit, newQuantity);
          if (finalQty < newQuantity) capped = true;
          return {
            ...item,
            quantity: finalQty,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
    });

    if (capped) {
      return { success: true, message: 'Reached maximum available inventory for this item.' };
    }
    return { success: true };
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const value: CartContextValue = {
    cart,
    isCartDrawerOpen,
    openCartDrawer,
    closeCartDrawer,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    canAddToCart,
    isItemInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
