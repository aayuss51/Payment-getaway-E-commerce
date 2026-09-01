import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, options?: { color?: string, size?: string, quantity?: number, variantId?: string }) => void;
  removeFromCart: (productId: string, color?: string, size?: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string, variantId?: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, options?: { color?: string, size?: string, quantity?: number, variantId?: string }) => {
    const { color, size, quantity = 1, variantId } = options || {};
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        item.selectedColor === color && 
        item.selectedSize === size &&
        item.selectedVariantId === variantId
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedColor === color && item.selectedSize === size && item.selectedVariantId === variantId)
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity, selectedColor: color, selectedSize: size, selectedVariantId: variantId }];
    });
  };

  const removeFromCart = (productId: string, color?: string, size?: string, variantId?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && item.selectedColor === color && item.selectedSize === size && item.selectedVariantId === variantId)
    ));
  };

  const updateQuantity = (productId: string, quantity: number, color?: string, size?: string, variantId?: string) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedColor === color && item.selectedSize === size && item.selectedVariantId === variantId)
        ? { ...item, quantity } 
        : item
    ));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => {
    let price = item.price;
    if (item.selectedVariantId && item.variants) {
      const variant = item.variants.find(v => v.id === item.selectedVariantId);
      if (variant) {
        price += (variant.priceDifference || 0);
      }
    }
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};



