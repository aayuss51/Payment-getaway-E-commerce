import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Trash2,
  Plus,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageUploadManager } from '../ImageUploadManager';

interface ProductUploadProps {
  onSave: (data: any) => void;
  initialData?: any;
}

export const ProductUpload: React.FC<ProductUploadProps> = ({ onSave, initialData }) => {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [description, setDescription] = useState(initialData?.description || '');
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Fashion');
  const [price, setPrice] = useState(initialData?.price || 0);
  const [stock, setStock] = useState(initialData?.stock || 0);
  
  const [seoTitle, setSeoTitle] = useState(initialData?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo?.description || '');
  
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Product Images Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 ">Product Media</h2>
            <p className="text-xs text-gray-400 font-bold   mt-1">Upload high-quality photos of your product</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <ImageUploadManager 
            images={images}
            onChange={setImages}
            maxImages={8}
          />
        </div>
      </section>

      {/* Product Details Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 ">Product Details</h2>
            <p className="text-xs text-gray-400 font-bold   mt-1">Provide detailed information about your product</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product in detail..."
              className="w-full h-48 p-8 bg-white border border-gray-100 rounded-[3rem] focus:ring-2 focus:ring-secondary focus:border-transparent transition-all resize-none text-sm font-medium leading-relaxed shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400   ml-4">Product Name (Nam)</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Handcrafted Pashmina Shawl" 
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-secondary transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400   ml-4">Category (Barga)</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-secondary transition-all appearance-none"
              >
                <option>Fashion</option>
                <option>Electronics</option>
                <option>Food & Grocery</option>
                <option>Home & Living</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400   ml-4">Price (NPR)</label>
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-secondary transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400   ml-4">Stock (Sankhya)</label>
              <input 
                type="number" 
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-secondary transition-all" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEO Settings Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 ">SEO Settings</h2>
            <p className="text-xs text-gray-400 font-bold   mt-1">Optimize your product for search engines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400   ml-4">SEO Title</label>
            <input 
              type="text" 
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Search engine friendly title" 
              className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-secondary transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400   ml-4">SEO Description</label>
            <textarea 
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Brief description for search results..."
              className="w-full h-32 p-6 bg-white border border-gray-100 rounded-3xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all resize-none text-sm font-medium leading-relaxed shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-4 shadow-2xl flex items-center justify-between gap-4">
          <button 
            onClick={() => onSave({ 
              name, 
              category, 
              price, 
              stock, 
              description, 
              images, 
              status: 'draft',
              seo: { title: seoTitle, description: seoDescription }
            })}
            className="px-8 py-4 text-xs font-black text-gray-400   transition-all"
          >
            Save Draft
          </button>
          <button 
            onClick={() => onSave({ 
              name, 
              category, 
              price, 
              stock, 
              description, 
              images, 
              status: 'active',
              seo: { title: seoTitle, description: seoDescription }
            })}
            className="flex-1 bg-secondary text-white px-8 py-4 rounded-[2rem] font-black text-xs   flex items-center justify-center gap-2 transition-all shadow-xl shadow-secondary/20"
          >
            {initialData ? 'Update Product' : 'Publish Product'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};



