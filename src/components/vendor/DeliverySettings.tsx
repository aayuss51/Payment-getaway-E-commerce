import React, { useState } from 'react';
import { Truck, Package, MapPin, CheckCircle2, Shield, AlertCircle, Info, ArrowRight, Printer, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeliverySettingsProps {
  currentMethod: 'platform' | 'self';
  onUpdate: (method: 'platform' | 'self') => void;
}

export const DeliverySettings: React.FC<DeliverySettingsProps> = ({ currentMethod, onUpdate }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintInvoice = () => {
    setIsPrinting(true);
    // Simulate printing
    setTimeout(() => {
      setIsPrinting(false);
      window.print();
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 ">Delivery & Logistics</h2>
          <p className="text-xs text-gray-400 font-bold   mt-1">Manage how you ship your orders</p>
        </div>
        <button 
          onClick={handlePrintInvoice}
          disabled={isPrinting}
          className="bg-white border border-gray-100 p-4 rounded-2xl text-gray-900 transition-all shadow-sm flex items-center gap-3 font-black text-[10px]  "
        >
          {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-5 h-5" />}
          Print Sample Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Platform Delivery */}
        <button 
          onClick={() => onUpdate('platform')}
          className={`p-8 rounded-[3rem] border-2 text-left transition-all relative overflow-hidden group ${
            currentMethod === 'platform' 
              ? 'bg-secondary border-secondary text-white shadow-2xl shadow-secondary/20' 
              : 'bg-white border-gray-100 text-gray-900'
          }`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity">
            <Truck className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              currentMethod === 'platform' ? 'bg-white/20' : 'bg-secondary/10 text-secondary'
            }`}>
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black ">Platform Delivery</h3>
              <p className={`text-[10px] font-black   mt-1 ${
                currentMethod === 'platform' ? 'text-secondary/20' : 'text-gray-400'
              }`}>Standard Logistics</p>
            </div>
            <p className={`text-xs font-medium leading-relaxed ${
              currentMethod === 'platform' ? 'text-white/80' : 'text-gray-500'
            }`}>
              We pick up your orders and deliver them to customers across Nepal. Includes tracking and insurance.
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentMethod === 'platform' ? 'bg-white' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-black  ">Recommended</span>
            </div>
          </div>
          {currentMethod === 'platform' && (
            <div className="absolute top-8 right-8">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        {/* Self-Ship */}
        <button 
          onClick={() => onUpdate('self')}
          className={`p-8 rounded-[3rem] border-2 text-left transition-all relative overflow-hidden group ${
            currentMethod === 'self' 
              ? 'bg-secondary border-gray-900 text-white shadow-2xl shadow-gray-900/20' 
              : 'bg-white border-gray-100 text-gray-900'
          }`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity">
            <Package className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              currentMethod === 'self' ? 'bg-white/20' : 'bg-gray-100 text-gray-400'
            }`}>
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black ">Self-Ship</h3>
              <p className={`text-[10px] font-black   mt-1 ${
                currentMethod === 'self' ? 'text-gray-400' : 'text-gray-400'
              }`}>Local Delivery</p>
            </div>
            <p className={`text-xs font-medium leading-relaxed ${
              currentMethod === 'self' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Handle delivery yourself using your own staff or local couriers. Best for food or fragile items.
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentMethod === 'self' ? 'bg-white' : 'bg-gray-300'}`}></div>
              <span className="text-[10px] font-black  ">Autonomous</span>
            </div>
          </div>
          {currentMethod === 'self' && (
            <div className="absolute top-8 right-8">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          )}
        </button>
      </div>

      {/* Logistics Info */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-black text-gray-900 ">Important Information</h4>
            <p className="text-[10px] text-gray-400 font-bold  ">Logistics Policy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <Shield className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-black text-gray-900">Insurance</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              Platform delivery covers up to NPR 10,000 for lost or damaged items.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-black text-gray-900">Coverage</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              We deliver to 77 districts. Self-ship is limited to your local area.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <FileText className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-black text-gray-900">Invoicing</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              All orders must include a VAT-compliant invoice for shipping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);



