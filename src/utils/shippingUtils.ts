import { Product } from '../types';

interface LandedCostInput {
  products: Product[];
  targetCountry: string;
  shippingMethod: 'standard' | 'express';
}

interface LandedCostResult {
  shippingFee: number;
  exportDuty: number;
  importTax: number;
  totalLandedCost: number;
  currency: string;
  breakdown: {
    basePrice: number;
    shipping: number;
    duties: number;
    taxes: number;
  };
}

/**
 * Mock API for Landed Cost Calculation
 * In a real app, this would call a logistics provider like DHL or FedEx
 */
export async function calculateLandedCost(input: LandedCostInput): Promise<LandedCostResult> {
  const { products, targetCountry, shippingMethod } = input;
  
  // 1. Calculate base price and total weight
  const basePrice = products.reduce((sum, p) => sum + p.price, 0);
  const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0.5), 0);

  // 2. Mock Shipping Rates (NPR per kg)
  const rates: Record<string, number> = {
    'USA': 2500,
    'UK': 2200,
    'Australia': 2000,
    'India': 800,
    'default': 3000
  };

  const rate = rates[targetCountry] || rates['default'];
  const shippingFee = totalWeight * rate * (shippingMethod === 'express' ? 1.5 : 1);

  // 3. Mock Export Duties (Nepal) - 1% of base price
  const exportDuty = basePrice * 0.01;

  // 4. Mock Import Taxes (Target Country) - 10-20% of (base + shipping)
  const taxRate = targetCountry === 'USA' ? 0.15 : 0.20;
  const importTax = (basePrice + shippingFee) * taxRate;

  const totalLandedCost = basePrice + shippingFee + exportDuty + importTax;

  return {
    shippingFee,
    exportDuty,
    importTax,
    totalLandedCost,
    currency: 'NPR',
    breakdown: {
      basePrice,
      shipping: shippingFee,
      duties: exportDuty,
      taxes: importTax
    }
  };
}
