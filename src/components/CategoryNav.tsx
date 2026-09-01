import React from 'react';
import { LayoutGrid, ChevronRight, Gift, Smartphone, Shirt, Home, Sparkles, Trophy, PackageOpen, X, Menu, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export interface SubCategory {
  id: string;
  label: string; // This will now be treated as a translation key
  to: string;
}

export interface Category {
  id: string;
  label: string; // This will now be treated as a translation key
  translationKey: string;
  image: string;
  icon: React.ElementType;
  subCategories: SubCategory[];
}

const CATEGORY_DATA: Category[] = [
  {
    id: 'fashion',
    label: 'Fashion',
    translationKey: 'cat_fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=400',
    icon: Shirt,
    subCategories: [
      { id: 'f1', label: "Men's Clothing", to: '/store?category=Fashion&sub=Men' },
      { id: 'f2', label: "Women's Clothing", to: '/store?category=Fashion&sub=Women' },
      { id: 'f3', label: 'Shoes & Footwear', to: '/store?category=Fashion&sub=Shoes' },
      { id: 'f4', label: 'Accessories', to: '/store?category=Fashion&sub=Accessories' },
    ]
  },
  {
    id: 'electronics',
    label: 'Electronics',
    translationKey: 'cat_electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=200&h=200&auto=format&fit=crop',
    icon: Smartphone,
    subCategories: [
      { id: 'e1', label: 'Smartphones', to: '/store?category=Electronics&sub=Smartphones' },
      { id: 'e2', label: 'Laptops', to: '/store?category=Electronics&sub=Laptops' },
      { id: 'e3', label: 'Audio & Music', to: '/store?category=Electronics&sub=Audio' },
      { id: 'e4', label: 'Smart Home', to: '/store?category=Electronics&sub=SmartHome' },
    ]
  },
  {
    id: 'home-decor',
    label: 'Home Decor',
    translationKey: 'cat_home',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=200&h=200&auto=format&fit=crop',
    icon: Home,
    subCategories: [
      { id: 'h1', label: 'Furniture', to: '/store?category=Home Decor&sub=Furniture' },
      { id: 'h2', label: 'Wall Art', to: '/store?category=Home Decor&sub=WallArt' },
      { id: 'h3', label: 'Lighting', to: '/store?category=Home Decor&sub=Lighting' },
    ]
  },
  {
    id: 'food',
    label: 'Food',
    translationKey: 'cat_food',
    image: 'https://images.unsplash.com/photo-1506617564039-2f3b650ad701?q=80&w=200&h=200&auto=format&fit=crop',
    icon: Sparkles,
    subCategories: [
      { id: 'fd1', label: 'Organic', to: '/store?category=Food&sub=Organic' },
      { id: 'fd2', label: 'Local Produce', to: '/store?category=Food&sub=Local' },
      { id: 'fd3', label: 'Spices', to: '/store?category=Food&sub=Spices' },
    ]
  },
  {
    id: 'beauty',
    label: 'Beauty',
    translationKey: 'cat_beauty',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=200&h=200&auto=format&fit=crop',
    icon: Sparkles,
    subCategories: [
      { id: 'b1', label: 'Skincare', to: '/store?category=Beauty&sub=Skincare' },
      { id: 'b2', label: 'Makeup', to: '/store?category=Beauty&sub=Makeup' },
      { id: 'b3', label: 'Fragrance', to: '/store?category=Beauty&sub=Fragrance' },
    ]
  },
  {
    id: 'sports',
    label: 'Sports',
    translationKey: 'cat_sports',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=200&h=200&auto=format&fit=crop',
    icon: Trophy,
    subCategories: [
      { id: 'sp1', label: 'Fitness Gear', to: '/store?category=Sports&sub=Fitness' },
      { id: 'sp2', label: 'Outdoor', to: '/store?category=Sports&sub=Outdoor' },
    ]
  }
];

export const CategoryNav = ({ className = "" }: { className?: string }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<Category>(CATEGORY_DATA[0]);

  return (
    <div 
      className={`relative ${className}`}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Desktop Category Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 bg-white border border-border/60 rounded-xl text-sm font-bold text-gray-800 transition-all group"
      >
        <div className="relative w-5 h-5 flex flex-col justify-center gap-1">
          <span className={`h-0.5 w-full bg-gray-400 rounded-full transition-all ${isOpen ? 'rotate-45 translate-y-1' : ''}`} />
          <span className={`h-0.5 w-full bg-gray-400 rounded-full transition-all ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-full bg-gray-400 rounded-full transition-all ${isOpen ? '-rotate-45 -translate-y-1' : ''}`} />
        </div>
        <span>{t('categories')}</span>
      </button>

      {/* Desktop Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 mt-2 w-[720px] bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-border/40 overflow-hidden z-[70] flex"
          >
              {/* Left Pane: Main Categories */}
              <div className="w-64 bg-gray-50/40 p-3 border-r border-border/40">
                <p className="px-4 py-2 text-[10px] font-black text-gray-400   mb-2">{t('primary_categories')}</p>
                <div className="space-y-1">
                  {CATEGORY_DATA.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                        activeCategory.id === cat.id
                          ? 'bg-secondary text-white shadow-xl shadow-secondary/20'
                          : 'text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeCategory.id === cat.id ? 'bg-white/20' : 'bg-white border border-border/60 shadow-sm'
                        }`}>
                          <cat.icon className={`w-5 h-5 ${activeCategory.id === cat.id ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-sm font-bold ">{t(cat.translationKey)}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                        activeCategory.id === cat.id ? 'translate-x-0 opacity-100' : 'opacity-0 -translate-x-2'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Pane: Subcategories */}
              <div className="flex-1 bg-white p-8 min-h-[460px] flex flex-col">
                <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
                  <div>
                    <h3 className="text-2xl font-black  text-gray-900">{t(activeCategory.translationKey)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                       <p className="text-xs text-secondary font-black  ">{t('curated_collections')}</p>
                    </div>
                  </div>
                  <div className="relative group/img">
                    <div className="absolute inset-0 bg-secondary/10 rounded-2xl blur-xl transition-all" />
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                      <img src={activeCategory.image} alt={activeCategory.label} className="w-full h-full object-cover transition-transform duration-700" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>

                {activeCategory.subCategories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {activeCategory.subCategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={sub.to}
                        onClick={() => setIsOpen(false)}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-transparent transition-all duration-300"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[15px] font-bold text-gray-800 transition-colors">{sub.label}</span>
                          <span className="text-[9px] text-gray-400   font-black flex items-center gap-1">
                            {t('visit_collection')}
                            <ChevronRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 -translate-x-2 transition-all duration-300">
                           <ArrowRight className="w-4 h-4 text-secondary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 bg-gray-100 rounded-[2rem] animate-pulse" />
                      <PackageOpen className="w-10 h-10 text-gray-300 relative z-10" />
                    </div>
                    <p className="text-lg font-black text-gray-900 ">{t('expanding_collections')}</p>
                    <p className="text-sm text-gray-400 mt-2 max-w-[200px] leading-relaxed">{t('expanding_desc')}</p>
                  </div>
                )}
                
                <div className="mt-auto pt-8 border-t border-border/40">
                  <Link 
                    to={`/store?category=${activeCategory.label}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-secondary text-white rounded-2xl font-bold transition-all duration-300 group"
                  >
                    {t('view_all')} {t(activeCategory.translationKey)}
                    <ArrowLeft className="w-4 h-4 rotate-180 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MobileCategoryOverlay = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 240 }}
            className="fixed top-0 left-0 bottom-0 w-[90%] max-w-[360px] bg-white z-[101] overflow-hidden flex flex-col shadow-[24px_0_48px_-12px_rgba(0,0,0,0.15)]"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-white text-gray-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="block font-black text-xl er text-gray-900">Bazaar</span>
                  <span className="block text-[8px] font-black text-secondary   -mt-0.5">Collections</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-8">
                {CATEGORY_DATA.map((cat) => (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-gray-50 border border-border/60 rounded-2xl flex items-center justify-center shadow-sm">
                            <cat.icon className="w-6 h-6 text-gray-400" />
                         </div>
                         <div>
                            <span className="block font-black text-lg  text-gray-900">{t(cat.translationKey)}</span>
                            <span className="block text-[8px] font-black text-gray-400  ">{cat.subCategories.length} {t('collections')}</span>
                         </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-2 pr-2">
                      {cat.subCategories.length > 0 ? cat.subCategories.map((sub) => (
                        <Link
                          key={sub.id}
                          to={sub.to}
                          onClick={onClose}
                          className="px-4 py-3 text-xs font-bold text-gray-600 bg-gray-50/50 rounded-xl border border-transparent transition-all"
                        >
                          {sub.label}
                        </Link>
                      )) : (
                        <div className="col-span-2 px-4 py-3 text-[10px] text-gray-400 italic flex items-center gap-2 bg-gray-50/30 rounded-xl">
                          <PackageOpen className="w-3 h-3" />
                           Curating new collections...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-border mt-auto">
              <Link 
                to="/store"
                onClick={onClose}
                className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-border/80 shadow-sm rounded-2xl text-sm font-black text-gray-800 transition-all"
              >
                {t('explore_marketplace')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};



