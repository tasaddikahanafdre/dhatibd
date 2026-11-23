'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant } from './types';

export interface CartItem {
  id: string; // unique item id (composite of product.id + variant?.id + options + deal)
  product: Product;
  quantity: number;
  variant?: ProductVariant | null;
  selected_options?: Record<string, string>;
  deal_info?: {
    deal_id: string;
    deal_slug: string;
    deal_title: string;
    deal_price: number;
    original_price: number;
    discount_text: string;
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product, 
    quantity?: number, 
    variant?: ProductVariant | null, 
    selectedOptions?: Record<string, string>,
    dealInfo?: CartItem['deal_info']
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  freeShippingThreshold: number;
  freeShippingProgress: number; // 0 to 100%
  amountUntilFreeShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const freeShippingThreshold = 3000;

  // Load from localStorage on client mount with deep defensive validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dhati_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized: CartItem[] = parsed
            .filter((item): item is CartItem => {
              return Boolean(
                item &&
                typeof item === 'object' &&
                item.product &&
                typeof item.product === 'object' &&
                item.product.id
              );
            })
            .map(item => {
              const basePrice = typeof item.product?.price === 'number' && !isNaN(item.product.price)
                ? item.product.price
                : (typeof item.deal_info?.deal_price === 'number' ? item.deal_info.deal_price : 0);
              const qty = Math.max(1, Number(item.quantity) || 1);

              return {
                ...item,
                id: String(item.id || item.product.id),
                quantity: qty,
                product: {
                  ...item.product,
                  price: basePrice,
                  name: item.product.name || 'Product',
                  slug: item.product.slug || 'product',
                  image_url: item.product.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120'
                }
              };
            });
          setCart(sanitized);
        }
      }
    } catch (e) {
      console.error('Failed to parse cart from storage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage on cart change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('dhati_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart to storage:', e);
      }
    }
  }, [cart, isHydrated]);

  const addToCart = (
    product: Product, 
    quantity = 1, 
    variant: ProductVariant | null = null,
    selectedOptions?: Record<string, string>,
    dealInfo?: CartItem['deal_info']
  ) => {
    if (!product || !product.id) return;

    const optionsKey = selectedOptions && Object.keys(selectedOptions).length > 0
      ? Object.entries(selectedOptions).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|')
      : '';
    const dealKey = dealInfo ? `-deal-${dealInfo.deal_id}` : '';
    const itemId = `${product.id}${variant ? `-${variant.id}` : ''}${optionsKey ? `-${optionsKey}` : ''}${dealKey}`;

    const safeProduct: Product = {
      ...product,
      price: typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0,
      name: product.name || 'Product',
      image_url: product.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120'
    };

    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        return prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item);
      }
      return [...prev, { id: itemId, product: safeProduct, quantity: Math.max(1, quantity), variant, selected_options: selectedOptions, deal_info: dealInfo }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);
  const cartSubtotal = cart.reduce((total, item) => {
    const unitPrice = item?.deal_info?.deal_price ?? item?.product?.price ?? 0;
    const qty = Number(item?.quantity) || 1;
    return total + ((Number(unitPrice) || 0) * qty);
  }, 0);
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));
  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        freeShippingThreshold,
        freeShippingProgress,
        amountUntilFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
