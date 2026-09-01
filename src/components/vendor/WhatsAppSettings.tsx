import React, { useState } from 'react';
import { MessageSquare, Phone, CheckCircle2, Zap, Bell, History, ArrowRight, Shield, Info, Loader2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppSettingsProps {
  linkedNumber?: string;
  onUpdate: (number: string) => void;
}

export const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ linkedNumber, onUpdate }) => {
  const [number, setNumber] = useState(linkedNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLinked, setIsLinked] = useState(!!linkedNumber);

  const handleLink = () => {
    setIsSaving(true);
    // Simulate linking
    setTimeout(() => {
      setIsSaving(false);
      setIsLinked(true);
      onUpdate(number);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 ">WhatsApp Integration</h2>
          <p className="text-xs text-gray-400 font-bold   mt-1">Manage your store via WhatsApp</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black   ${
          isLinked ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isLinked ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
          {isLinked ? 'Linked' : 'Not Linked'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Link Section */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <MessageSquare className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600">
                <Smartphone className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 ">Link Your Number</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Receive order notifications and update stock by simply chatting with our bot.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400   ml-4">WhatsApp Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-6 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="+977 98XXXXXXXX"
                      className="w-full bg-gray-50 border-none rounded-[2rem] pl-14 pr-8 py-5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleLink}
                  disabled={isSaving || !number}
                  className={`w-full py-5 rounded-[2rem] font-black text-xs   flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isLinked 
                      ? 'bg-secondary text-white shadow-gray-900/20' 
                      : 'bg-emerald-600 text-white shadow-emerald-600/20'
                  }`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isLinked ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {isSaving ? 'Linking...' : isLinked ? 'Update Number' : 'Link WhatsApp'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-red-50/50 p-8 rounded-[2.5rem] border border-red-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <Shield className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-black text-red-900  ">Privacy First</h5>
            </div>
            <p className="text-xs text-red-800 leading-relaxed font-medium">
              We never share your number with buyers. All communication is routed through our secure platform bot.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-gray-900   ml-4">Available Commands</h3>
          <div className="space-y-4">
            {[
              { icon: Bell, title: 'Order Alerts', desc: 'Get instant notifications for new orders and payments.', color: 'secondary' },
              { icon: Zap, title: 'Stock Update', desc: 'Reply with "STOCK [Product] [Qty]" to update inventory.', color: 'blue' },
              { icon: History, title: 'Sales Summary', desc: 'Get daily and weekly sales reports directly in chat.', color: 'purple' },
              { icon: MessageSquare, title: 'Customer Chat', desc: 'Reply to customer inquiries without opening the app.', color: 'pink' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group transition-all"
              >
                <div className={`w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shrink-0 transition-all`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 ">{feature.title}</h4>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mt-0.5">{feature.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-200 ml-auto transition-all" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};



