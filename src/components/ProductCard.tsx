import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, Eye, MessageSquare, X, Info, Store, MapPin, Phone, Mail, Award, Heart, Scale, Zap } from 'lucide-react';
import { Product, VendorStore } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isInCompare } = useCompare();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  const [vendorStore, setVendorStore] = useState<VendorStore | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      if (showAbout && product.vendorId && !vendorStore) {
        setLoadingVendor(true);
        try {
          const vendorDoc = await getDoc(doc(db, 'vendors', product.vendorId));
          if (vendorDoc.exists()) {
            setVendorStore(vendorDoc.data() as VendorStore);
          }
        } catch (error) {
          console.error("Error fetching vendor:", error);
        } finally {
          setLoadingVendor(false);
        }
      }
    };

    fetchVendor();
  }, [showAbout, product.vendorId, vendorStore]);

  const rating = product.rating || 4.8;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="group bg-white border border-border rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full relative"
      >
        <div className="relative aspect-square overflow-hidden bg-surface">
          <Link to={`/product/${product.id}`} className="block h-full">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />
          </Link>
          
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 transition-all duration-300">
            <button 
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product);
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                isInWishlist(product.id) 
                  ? 'bg-secondary text-white' 
                  : 'bg-white text-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {product.isFeatured && (
            <div className="absolute top-3 left-3 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-md   shadow-sm flex items-center gap-1 z-10">
              <Zap className="w-3 h-3 fill-white" />
              {t('featured')}
            </div>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-secondary text-white text-[10px] font-bold   px-4 py-2 rounded-md">
                {t('out_of_stock')}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-gray-400  ">{product.category}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-secondary text-secondary" />
              <span className="text-[10px] font-bold text-gray-600">{rating}</span>
            </div>
          </div>

          <Link to={`/product/${product.id}`} className="block mb-1">
            <h3 className="text-sm font-semibold text-gray-900 transition-colors line-clamp-2 min-h-[2.5rem] leading-tight">{product.name}</h3>
          </Link>
          
          <p className="text-[10px] text-gray-400 mb-3 italic">
            {t('by')} <span className="font-semibold text-gray-600 underline decoration-gray-200 underline-offset-2">{product.vendorName || 'Bazaar'}</span>
          </p>
          
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base font-bold text-gray-900">NPR {product.price.toLocaleString()}</span>
              {product.price > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  NPR {(product.price * 1.2).toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 transition-opacity duration-300">
              <button 
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="flex-1 px-3 py-2 border border-border text-gray-700 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
              >
                {t('add_to_cart')}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAbout(true);
                }}
                className="p-2 bg-secondary text-white rounded-lg transition-all shadow-sm"
                title={t('view_full_details')}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* About Product Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAbout(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-paper w-full max-w-2xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90vh] lux-border"
            >
              <div className="relative h-80 bg-red-50/30">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent opacity-60" />
                <button 
                  onClick={() => setShowAbout(false)}
                  className="absolute top-6 right-6 p-3 lux-glass rounded-full text-primary transition-all duration-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 sm:p-12 overflow-y-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-secondary  ">{product.category}</span>
                    <h2 className="font-serif text-4xl text-primary mt-2">{product.name}</h2>
                    <p className="text-sm text-gray-400 mt-2">{t('by')} {product.vendorName}</p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-3xl font-serif text-red-700">NPR {product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-300 line-through">NPR {(product.price * 1.2).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400   mb-4">{t('description')}</h4>
                    <p className="text-gray-600 leading-relaxed font-serif text-lg opacity-80">{product.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 bg-paper border border-red-200/30 rounded-[2rem]">
                      <h4 className="text-[10px] font-bold text-gray-400   mb-2">{t('stock_status')}</h4>
                      <p className={`text-lg font-serif ${product.stock > 0 ? 'text-primary' : 'text-accent'}`}>
                        {product.stock > 0 ? `${product.stock} ${t('units_available')}` : t('out_of_stock')}
                      </p>
                    </div>
                    <div className="p-8 bg-paper border border-red-200/30 rounded-[2rem]">
                      <h4 className="text-[10px] font-bold text-gray-400   mb-2">{t('rating')}</h4>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-red-500 text-red-500" />
                        <span className="text-xl font-serif text-primary">4.8</span>
                        <span className="text-xs text-gray-400">(128 {t('reviews')})</span>
                      </div>
                    </div>
                  </div>

                  {product.variants && product.variants.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-gray-400   mb-3">{t('options')}</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {product.variants.map((variant) => (
                          <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-900">{variant.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500">{variant.stock} {t('units_available')}</span>
                              <span className="text-sm font-black text-gray-900">NPR {(product.price + (variant.priceDifference || 0)).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vendor Profile Section */}
                  <div className="pt-12 border-t border-red-200/30">
                    <h4 className="text-[10px] font-bold text-gray-400   mb-8">{t('about_vendor')}</h4>
                    {loadingVendor ? (
                      <div className="animate-pulse flex gap-8">
                        <div className="w-24 h-24 bg-red-50/50 rounded-[2rem]" />
                        <div className="flex-1 space-y-4 pt-2">
                          <div className="h-4 bg-red-50/50 rounded w-1/3" />
                          <div className="h-4 bg-red-50/50 rounded w-2/3" />
                        </div>
                      </div>
                    ) : vendorStore ? (
                      <div className="bg-red-50/30 lux-border rounded-[2.5rem] p-8 md:p-10">
                        <div className="flex flex-col sm:flex-row gap-8 mb-10">
                          <div className="w-24 h-24 rounded-[2rem] bg-paper shadow-lg border border-red-100 overflow-hidden shrink-0">
                            {vendorStore.logoUrl ? (
                              <img src={vendorStore.logoUrl} alt={vendorStore.storeName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-paper text-secondary">
                                <Store className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="bg-secondary px-4 py-1 rounded-lg">
                                <h5 className="font-serif text-2xl text-white">{vendorStore.storeName}</h5>
                              </div>
                              {vendorStore.isTopRated && (
                                <Award className="w-5 h-5 text-secondary" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-3 line-clamp-3 leading-relaxed">{vendorStore.description}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 border-y border-red-200/30 py-8">
                          {[
                            { icon: MapPin, label: "Heritage", translationKey: "heritage", value: vendorStore.shippingAddress ? `${vendorStore.shippingAddress.city}, Nepal` : 'Nepal' },
                            { icon: Phone, label: "Concierge", translationKey: "concierge", value: vendorStore.contactPhone || 'Private' },
                            { icon: Mail, label: "Inquiries", translationKey: "inquiries", value: vendorStore.contactEmail || 'Support' }
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-secondary  ">{t(item.translationKey)}</span>
                              <div className="flex items-center gap-2">
                                <item.icon className="w-3 h-3 text-gold-400" />
                                <span className="text-xs font-serif text-primary truncate">{item.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
 
                        <Link 
                          to={`/vendor/${vendorStore.storeSlug}`}
                          className="w-full py-5 bg-secondary text-paper rounded-full text-xs font-bold   transition-all duration-500 flex items-center justify-center gap-3 lux-shadow"
                        >
                          <Store className="w-4 h-4" />
                          {t('visit_store')}
                        </Link>
                      </div>
                    ) : (
                      <div className="p-10 bg-red-50/30 border border-red-100 rounded-[2.5rem] text-center font-serif">
                        <p className="text-gray-500">{t('by')} {product.vendorName}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 pt-12">
                    <button 
                      onClick={() => {
                        addToCart(product);
                        setShowAbout(false);
                      }}
                      className="flex-1 bg-secondary text-paper px-8 py-5 rounded-full font-bold   text-xs transition-all duration-500 shadow-xl shadow-secondary/20 flex items-center justify-center gap-3"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {t('add_to_cart')}
                    </button>
                    <Link 
                      to={`/product/${product.id}`}
                      className="flex-1 bg-secondary text-paper px-8 py-5 rounded-full font-bold   text-xs transition-all duration-500 flex items-center justify-center gap-3"
                    >
                      <Eye className="w-5 h-5" />
                      {t('view_full_details')}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};



