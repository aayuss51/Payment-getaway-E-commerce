import React, { useState } from 'react';
import { Wallet, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { VendorStore } from '../../types';

interface PaymentGatewaySettingsProps {
  vendorProfile: VendorStore;
  vendorDocId: string;
  onUpdate: (data: Partial<VendorStore>) => void;
}

export const PaymentGatewaySettings: React.FC<PaymentGatewaySettingsProps> = ({ 
  vendorProfile, 
  vendorDocId,
  onUpdate 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    esewaId: vendorProfile.esewaId || '',
    khaltiId: vendorProfile.khaltiId || ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const vendorRef = doc(db, 'vendors', vendorDocId);
      await updateDoc(vendorRef, formData);
      onUpdate(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving payment gateway settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
          <Wallet className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 ">Payment Gateways</h2>
          <p className="text-gray-500 text-sm">Configure your eSewa and Khalti IDs for payouts.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* eSewa Section */}
          <div className="space-y-4 p-6 bg-green-50/30 rounded-[2rem] border border-green-100/50">
            <div className="flex items-center gap-3 mb-2">
              <img src="https://cdn.iconscout.com/icon/free/png-256/esewa-3-1175111.png" className="h-8" alt="eSewa" />
              <h3 className="font-black text-gray-900   text-xs">eSewa Wallet</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400   ml-1">eSewa ID (Phone/Email)</label>
              <input 
                type="text"
                value={formData.esewaId}
                onChange={(e) => setFormData({ ...formData, esewaId: e.target.value })}
                placeholder="98XXXXXXXX"
                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          {/* Khalti Section */}
          <div className="space-y-4 p-6 bg-purple-50/30 rounded-[2rem] border border-purple-100/50">
            <div className="flex items-center gap-3 mb-2">
              <img src="https://khalti.com/wp-content/uploads/2017/01/khalti-logo.png" className="h-8" alt="Khalti" />
              <h3 className="font-black text-gray-900   text-xs">Khalti Wallet</h3>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400   ml-1">Khalti ID (Phone Number)</label>
              <input 
                type="text"
                value={formData.khaltiId}
                onChange={(e) => setFormData({ ...formData, khaltiId: e.target.value })}
                placeholder="98XXXXXXXX"
                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-gray-400 font-medium max-w-md">
            Your payout requests will be processed using these IDs by default. Make sure they are correct to avoid payment delays.
          </p>
          <button 
            type="submit"
            disabled={isSaving}
            className={`px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl ${
              saveSuccess 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-secondary text-white shadow-gray-900/20'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Save className="w-6 h-6" />
            )}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};



