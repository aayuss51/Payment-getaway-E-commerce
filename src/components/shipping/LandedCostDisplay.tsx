import React, { useState, useEffect } from 'react';
import { calculateLandedCost } from '../../utils/shippingUtils';
import { Product } from '../../types';
import { Truck, Globe, Info, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandedCostDisplayProps {
  products: Product[];
  targetCountry: string;
  shippingMethod: 'standard' | 'express';
}

export const LandedCostDisplay: React.FC<LandedCostDisplayProps> = ({ products, targetCountry, shippingMethod }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const fetchCost = async () => {
      setLoading(true);
      try {
        const costResult = await calculateLandedCost({ products, targetCountry, shippingMethod });
        setResult(costResult);
      } catch (error) {
        console.error("Error calculating landed cost:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCost();
  }, [products, targetCountry, shippingMethod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-3xl border border-gray-100">
        <Loader2 className="w-6 h-6 animate-spin text-secondary mr-3" />
        <span className="text-sm font-bold text-gray-500  ">Calculating Landed Cost...</span>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-2xl">
            <Globe className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">International Shipping (DDP)</h3>
            <p className="text-xs text-gray-500 font-bold  ">Delivered Duty Paid to {targetCountry}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-gray-900">NPR {result.totalLandedCost.toLocaleString()}</span>
          <p className="text-[10px] text-gray-400 font-bold   mt-1">Total Landed Cost</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black   mb-1">Shipping</p>
          <p className="text-sm font-bold text-gray-900">NPR {result.shippingFee.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black   mb-1">Export Duty</p>
          <p className="text-sm font-bold text-gray-900">NPR {result.exportDuty.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black   mb-1">Import Tax</p>
          <p className="text-sm font-bold text-gray-900">NPR {result.importTax.toLocaleString()}</p>
        </div>
      </div>

      <button 
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs   transition-all flex items-center justify-center gap-2"
      >
        <Info className="w-4 h-4" />
        {showBreakdown ? 'Hide Breakdown' : 'View Detailed Breakdown'}
        <ChevronRight className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {showBreakdown && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Base Product Price</span>
                <span className="text-gray-900 font-bold">NPR {result.breakdown.basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">International Freight ({shippingMethod})</span>
                <span className="text-gray-900 font-bold">NPR {result.breakdown.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Nepal Export Duty (1%)</span>
                <span className="text-gray-900 font-bold">NPR {result.breakdown.duties.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">{targetCountry} Import Tax & VAT</span>
                <span className="text-gray-900 font-bold">NPR {result.breakdown.taxes.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 mt-4">
                <p className="text-[10px] text-secondary font-black   mb-1 flex items-center gap-2">
                  <Truck className="w-3 h-3" /> DDP Guarantee
                </p>
                <p className="text-xs text-secondary font-medium leading-relaxed">
                  This price includes all duties and taxes. No additional payments will be required at the time of delivery in {targetCountry}.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



