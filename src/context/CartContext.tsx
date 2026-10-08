import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '@/types/product';

interface LineOpts {
  selectedSize?: string;
  selectedColor?: string;
  selectedPackage?: string;
  selectedVariants?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    size?: string,
    color?: string,
    openSidebar?: boolean,
    pkg?: { name: string; price: number } | null,
    variants?: Record<string, string> | null
  ) => void;
  removeFromCart: (productId: string, opts?: LineOpts) => void;
  updateQuantity: (productId: string, quantity: number, opts?: LineOpts) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aminone_cart';

const variantKey = (v?: Record<string, string> | null) =>
  v ? JSON.stringify(Object.keys(v).sort().map((k) => [k, v[k]])) : '';

const sameLine = (item: CartItem, productId: string, opts?: LineOpts) =>
  item.id === productId &&
  (opts === undefined
    ? true
    : item.selectedSize === opts.selectedSize &&
      item.selectedColor === opts.selectedColor &&
      item.selectedPackage === opts.selectedPackage &&
      variantKey(item.selectedVariants) === variantKey(opts.selectedVariants));

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToCart = (
    product: Product,
    quantity = 1,
    size?: string,
    color?: string,
    _openSidebar = true,
    pkg?: { name: string; price: number } | null,
    variants?: Record<string, string> | null
  ) => {
    setItems((prev) => {
      const pkgName = pkg?.name;
      const vKey = variantKey(variants);
      const effectivePrice = pkg?.price ?? product.price;
      const existingItem = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color &&
          item.selectedPackage === pkgName &&
          variantKey(item.selectedVariants) === vKey
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color &&
          item.selectedPackage === pkgName &&
          variantKey(item.selectedVariants) === vKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          price: effectivePrice,
          quantity,
          selectedSize: size,
          selectedColor: color,
          selectedPackage: pkgName,
          selectedVariants: variants && Object.keys(variants).length > 0 ? variants : undefined,
        },
      ];
    });
  };

  const removeFromCart = (productId: string, opts?: LineOpts) => {
    setItems((prev) => prev.filter((item) => !sameLine(item, productId, opts)));
  };

  const updateQuantity = (productId: string, quantity: number, opts?: LineOpts) => {
    if (quantity <= 0) {
      removeFromCart(productId, opts);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (sameLine(item, productId, opts) ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
