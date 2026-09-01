import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  canCompare: (product: Product) => { allowed: boolean; reason?: string };
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<Product[]>(() => {
    const saved = localStorage.getItem('compareList');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  const canCompare = (product: Product) => {
    if (compareList.length === 0) return { allowed: true };
    
    // Check if same category
    const firstProduct = compareList[0];
    if (firstProduct.category !== product.category) {
      return { 
        allowed: false, 
        reason: `You can only compare products from the same category (${firstProduct.category}).` 
      };
    }

    if (compareList.length >= 4) {
      return {
        allowed: false,
        reason: "You can compare up to 4 products at a time."
      };
    }

    return { allowed: true };
  };

  const addToCompare = (product: Product) => {
    const check = canCompare(product);
    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    setCompareList(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(item => item.id !== productId));
  };

  const isInCompare = (productId: string) => {
    return compareList.some(item => item.id === productId);
  };

  const toggleCompare = (product: Product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const clearCompare = () => setCompareList([]);

  return (
    <CompareContext.Provider value={{ 
      compareList, 
      addToCompare, 
      removeFromCompare, 
      isInCompare, 
      toggleCompare,
      clearCompare,
      canCompare
    }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within a CompareProvider');
  return context;
};



