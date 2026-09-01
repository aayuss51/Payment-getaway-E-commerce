import React from 'react';
import { Share2, QrCode, Download, Instagram, Facebook, Twitter, Link as LinkIcon, Sparkles, ArrowRight, Store, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, VendorStore } from '../../types';

interface ShareKitProps {
  product?: Product;
  vendorProfile: VendorStore;
}

export const ShareKit: React.FC<ShareKitProps> = ({ product, vendorProfile }) => {
  const storeUrl = `https://${vendorProfile.storeSlug}.bazaar.com.np`;
  const productUrl = product ? `${storeUrl}/product/${product.id}` : storeUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 ">Share Kit</h2>
          <p className="text-xs text-gray-400 font-bold   mt-1">Marketing tools for your store</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-[10px] font-black  ">
          <Sparkles className="w-3 h-3" /> Auto-Generated
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Story Preview */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-gray-900   ml-4">Story Preview (Instagram/FB)</h3>
          <div className="aspect-[9/16] max-w-[320px] mx-auto bg-secondary rounded-[3rem] overflow-hidden shadow-2xl relative group">
            {/* Background Image */}
            <img 
              src={product?.images[0] || vendorProfile.bannerUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920"} 
              className="w-full h-full object-cover opacity-60"
              alt="Story Background"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-900 shadow-lg">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black ">{vendorProfile.storeName}</p>
                  <p className="text-[8px] font-black   text-secondary">Official Store</p>
                </div>
              </div>

              <div className="space-y-6 text-center">
                {product && (
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black leading-tight ">{product.name}</h4>
                    <p className="text-secondary font-black text-lg">NPR {product.price.toLocaleString()}</p>
                  </div>
                )}
                
                <div className="bg-white p-4 rounded-[2rem] inline-block shadow-2xl">
                  <QrCode className="w-24 h-24 text-gray-900" />
                  <p className="text-[8px] text-gray-400 font-black   mt-2">Scan to Shop</p>
                </div>

                <div className="pt-4">
                  <div className="bg-white/20 backdrop-blur-md rounded-full px-6 py-3 flex items-center justify-center gap-2 border border-white/20">
                    <span className="text-[10px] font-black  ">Shop Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[8px] font-black   text-white/40">Powered by Bazaar</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-black text-[10px]   flex items-center gap-2 transition-all shadow-xl shadow-gray-900/20">
              <Download className="w-4 h-4" /> Download Story
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-lg font-black text-gray-900 ">Direct Links</h4>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate">{productUrl}</p>
                </div>
                <button className="text-[10px] font-black text-secondary   shrink-0">
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-lg font-black text-gray-900 ">Social Channels</h4>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-6 bg-gray-50 rounded-3xl flex flex-col items-center gap-3 transition-all group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pink-600 shadow-sm transition-all">
                  <Instagram className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black   text-gray-400">Instagram</span>
              </button>
              <button className="p-6 bg-gray-50 rounded-3xl flex flex-col items-center gap-3 transition-all group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm transition-all">
                  <Facebook className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black   text-gray-400">Facebook</span>
              </button>
            </div>
          </div>

          <div className="bg-secondary/5 p-8 rounded-[2.5rem] border border-secondary/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-black text-secondary-900  ">Marketing Tip</h5>
            </div>
            <p className="text-xs text-secondary/80 leading-relaxed font-medium">
              Sharing your products on Instagram Stories increases visibility by up to 40% in the Kathmandu market. Don't forget to tag @BazaarNepal!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



