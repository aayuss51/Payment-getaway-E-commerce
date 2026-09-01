import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingBag, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const Wishlist = () => {
  const { t } = useTranslation();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 ">{t('wishlist_empty')}</h1>
        <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
          {t('wishlist_empty_desc')}
        </p>
        <Link 
          to="/store" 
          className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-secondary/10"
        >
          {t('explore_products')} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <BackButton />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-gray-900 ">{t('my_wishlist')}</h1>
          <p className="text-gray-500 font-medium mt-2">
            {wishlist.length === 1 
              ? t('item_saved', { count: wishlist.length }) 
              : t('items_saved', { count: wishlist.length })}
          </p>
        </div>
        <button 
          onClick={clearWishlist}
          className="text-sm font-bold text-red-500 flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" /> {t('clear_all')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {wishlist.map((product) => (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden transition-all duration-500 flex flex-col"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500" />
                
                <button 
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 shadow-lg transition-all duration-300 z-10"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-4">
                  <p className="text-[10px] font-black text-secondary   mb-1">{product.category}</p>
                  <Link to={`/product/${product.id}`} className="text-xl font-black text-gray-900 transition-colors line-clamp-1">
                    {product.name}
                  </Link>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400  ">{t('price')}</p>
                    <p className="text-2xl font-black text-gray-900">Rs. {product.price.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => addToCart(product)}
                    className="p-4 bg-secondary text-white rounded-2xl transition-all shadow-lg shadow-secondary/10 group/btn"
                  >
                    <ShoppingCart className="w-6 h-6 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};



