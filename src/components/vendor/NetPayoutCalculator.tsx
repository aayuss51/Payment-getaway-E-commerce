import React, { useState } from 'react';
import { Calculator, Info, ArrowRight } from 'lucide-react';

interface NetPayoutCalculatorProps {
  commissionRate: number;
}

export const NetPayoutCalculator: React.FC<NetPayoutCalculatorProps> = ({ commissionRate }) => {
  const [price, setPrice] = useState<number>(0);
  
  const gatewayFee = 0.02; // 2%
  const vatRate = 0.13; // 13%
  
  const totalDeductionRate = (commissionRate / 100) + gatewayFee + vatRate;
  const vendorReceives = price * (1 - totalDeductionRate);
  const totalDeductions = price * totalDeductionRate;

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-gray-100 rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-sm  ">Payout Calculator</h3>
          <p className="text-[10px] text-gray-400 font-bold  ">Net Earnings Estimator</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400   ml-1">Display Price (NPR)</label>
          <div className="relative">
            <input 
              type="number" 
              value={price || ''} 
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="Enter selling price..."
              className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-gray-400">Platform Commission ({commissionRate}%)</span>
            <span className="text-red-400">- NPR {(price * (commissionRate / 100)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-gray-400">Payment Gateway (2%)</span>
            <span className="text-red-400">- NPR {(price * 0.02).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-gray-400">VAT (13%)</span>
            <span className="text-red-400">- NPR {(price * 0.13).toFixed(2)}</span>
          </div>
          
          <div className="pt-3 border-t border-dashed border-gray-100">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-400   mb-1">You Receive (Muna-fa)</p>
                <p className="text-xl font-black text-secondary">NPR {vendorReceives.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400   mb-1">Total Fees</p>
                <p className="text-xs font-bold text-gray-400">NPR {totalDeductions.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary/5 rounded-2xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-[10px] text-secondary/80 leading-relaxed font-medium">
          This is an estimate. Actual payouts may vary based on shipping costs and returns.
        </p>
      </div>
    </div>
  );
};



