import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, VendorStore } from '../types';
import { ProductCard } from '../components/ProductCard';
import { BackButton } from '../components/BackButton';
import { VendorReviews } from '../components/vendor/VendorReviews';
import { MapPin, Phone, Mail, Star, Shield, Clock, ChevronRight, Store, LayoutGrid, List, Search, Filter, Info, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';

const StoreSlider = ({ images }: { images: { url: string; link?: string; title?: string; description?: string }[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img 
            src={images[current].url} 
            className="w-full h-full object-cover" 
            alt={images[current].title || "Store Banner"} 
            referrerPolicy="no-referrer"
          />
          {(images[current].title || images[current].description) && (
            <div className="absolute inset-x-0 bottom-32 sm:bottom-48 px-6 sm:px-12 pointer-events-none">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-2xl bg-black/30 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-white/10 inline-block"
                >
                  {images[current].title && (
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
                      {images[current].title}
                    </h2>
                  )}
                  {images[current].description && (
                    <p className="text-white/80 text-sm sm:text-lg font-medium mb-6">
                      {images[current].description}
                    </p>
                  )}
                  {images[current].link && (
                    <Link 
                      to={images[current].link!} 
                      className="inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-xl font-black text-sm hover:bg-secondary hover:text-white transition-all pointer-events-auto"
                    >
                      Shop Now <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Particles/Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              current === i ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Slide Navigation Buttons */}
      <button 
        onClick={() => setCurrent((prev) => (prev - 1 + images.length) % images.length)}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/10 hover:bg-white/20 transition-all opacity-0 md:opacity-100"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <button 
        onClick={() => setCurrent((prev) => (prev + 1) % images.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/10 hover:bg-white/20 transition-all opacity-0 md:opacity-100"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export const VendorStorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');

  useEffect(() => {
    const fetchVendorAndProducts = async () => {
      if (!slug) return;
      try {
        // Fetch vendor by slug
        const vendorsRef = collection(db, 'vendors');
        const q = query(vendorsRef, where('storeSlug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const vendorDoc = querySnapshot.docs[0];
          const vendorData = { uid: vendorDoc.id, ...vendorDoc.data() } as VendorStore;
          setVendor(vendorData);

          // Fetch vendor's products
          const productsRef = collection(db, 'products');
          const pq = query(productsRef, where('vendorId', '==', vendorDoc.id), where('status', '==', 'active'));
          const pSnapshot = await getDocs(pq);
          const fetchedProducts = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setProducts(fetchedProducts);
        }
      } catch (error) {
        console.error("Error fetching vendor store:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorAndProducts();
  }, [slug]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full"
        />
        <p className="mt-4 text-gray-500 font-bold animate-pulse">{t('opening_store_doors')}</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('store_not_found')}</h2>
        <Link to="/" className="text-secondary hover:underline mt-4 inline-block">{t('return_to_home')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <BackButton />
      </div>
      {/* Store Hero / Slider */}
      {vendor.sliderImages && vendor.sliderImages.length > 0 ? (
        <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-secondary overflow-hidden">
          <StoreSlider images={vendor.sliderImages} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          
          {/* Store Profile Overlay (Reduced for slider) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 z-10 pointer-events-none text-white">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left pointer-events-auto">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0"
              >
                <img 
                  src={vendor.logoUrl || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop"} 
                  alt={vendor.storeName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-1">
                  <h1 className="text-xl sm:text-3xl font-black  text-white">{vendor.storeName}</h1>
                  {vendor.isTopRated && (
                     <span className="px-3 py-1 bg-secondary text-white text-[8px] font-black   rounded-full flex items-center gap-1 shadow-lg shadow-secondary/20">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {t('top_rated')}
                    </span>
                  )}
                </div>
                <p className="text-white/80 font-medium max-w-2xl line-clamp-1 text-xs sm:text-sm">{vendor.description}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Original Store Banner */
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img 
            src={vendor.bannerUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920"} 
            alt={vendor.storeName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Store Profile Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0"
              >
                <img 
                  src={vendor.logoUrl || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop"} 
                  alt={vendor.storeName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="flex-1 text-white pb-2">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-black  text-white">{vendor.storeName}</h1>
                  {vendor.isTopRated && (
                     <span className="px-3 py-1 bg-secondary text-white text-[10px] font-black   rounded-full flex items-center gap-1 shadow-lg shadow-secondary/20">
                      <Star className="w-3 h-3 fill-current" />
                      {t('top_rated')}
                    </span>
                  )}
                </div>
                <p className="text-white/80 font-medium max-w-2xl line-clamp-2 text-sm sm:text-base">{vendor.description}</p>
              </div>
              
              {/* Stats for Mobile & Desktop */}
              <div className="flex items-center gap-2 sm:gap-4 pb-2 w-full sm:w-auto justify-center sm:justify-start overflow-x-auto no-scrollbar py-2 sm:py-0">
                <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-white/20 text-center shrink-0">
                  <p className="text-[8px] sm:text-[10px]  font-black  text-white/60">{t('products')}</p>
                  <p className="text-base sm:text-xl font-black text-white">{products.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-white/20 text-center shrink-0">
                  <p className="text-[8px] sm:text-[10px]  font-black  text-white/60">{t('rating')}</p>
                  <p className="text-base sm:text-xl font-black text-white">{vendor.rating || '0.0'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-white/20 text-center shrink-0">
                  <p className="text-[8px] sm:text-[10px]  font-black  text-white/60">{t('reviews')}</p>
                  <p className="text-base sm:text-xl font-black text-white">{vendor.reviewsCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-secondary" />
                {t('store_info')}
              </h3>
              <div className="space-y-4">
                {vendor.shopLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 font-medium">{vendor.shopLocation}</span>
                  </div>
                )}
                {vendor.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">{vendor.contactPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600 font-medium">{t('joined')} {vendor.createdAt ? new Date(vendor.createdAt).getFullYear() : new Date().getFullYear()}</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-600">
                  <Shield className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold  ">{t('verified_merchant')}</span>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-50 space-y-3">
                <button 
                  onClick={() => navigate(`/chat?vendorId=${vendor.uid}&vendor=${encodeURIComponent(vendor.storeName)}`)}
                  className="w-full bg-secondary text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  {t('chat_with_seller')}
                </button>
                {vendor.contactEmail && (
                  <button 
                    onClick={() => window.location.href = `mailto:${vendor.contactEmail}`}
                    className="w-full bg-secondary text-white py-4 rounded-2xl font-black hover:bg-gray-800 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    {t('send_email')}
                  </button>
                )}
              </div>
            </div>

            {/* Categories or Filters could go here */}
          </div>

          {/* Product Grid & Reviews */}
          <div className="lg:col-span-3 space-y-8">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-100 mb-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-4 px-2 text-sm font-black   transition-all relative ${
                  activeTab === 'products' ? 'text-secondary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('products_count', { count: products.length })}
                {activeTab === 'products' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-secondary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 px-2 text-sm font-black   transition-all relative ${
                  activeTab === 'reviews' ? 'text-secondary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('reviews_count', { count: vendor.reviewsCount || 0 })}
                {activeTab === 'reviews' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-secondary rounded-full" />
                )}
              </button>
            </div>

            {activeTab === 'products' ? (
              <>
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder={t('search_in_store')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none focus:ring-2 focus:ring-primary rounded-2xl text-sm font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Products */}
                {filteredProducts.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-6'}>
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">{t('no_products_found_store')}</h3>
                    <p className="text-gray-500 mt-2">{t('try_searching_else')}</p>
                  </div>
                )}
              </>
            ) : (
              <VendorReviews vendorId={vendor.uid} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



