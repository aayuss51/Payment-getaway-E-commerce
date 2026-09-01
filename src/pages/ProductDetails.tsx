import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, VendorStore } from '../types';
import { BackButton } from '../components/BackButton';
import { ShoppingCart, Star, Shield, Truck, Globe, MessageCircle, Send, X, User, Bot, Store, ArrowLeft, ChevronRight, Info, Heart, Scale, Share, Ruler, Minus, Plus, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useTranslation } from 'react-i18next';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1
    }
  },
  viewport: { once: true, margin: "-100px" }
};

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isInCompare } = useCompare();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<VendorStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProductAndVendor = async () => {
      if (!id) return;
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          setProduct(productData);

          const vendorDoc = await getDoc(doc(db, 'vendors', productData.vendorId));
          if (vendorDoc.exists()) {
            setVendor({ uid: vendorDoc.id, ...vendorDoc.data() } as VendorStore);
          }
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndVendor();
  }, [id]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant) {
      const variant = product.variants?.find(v => v.id === selectedVariant);
      if (variant) return product.price + (variant.priceDifference || 0);
    }
    return product.price;
  }, [product, selectedVariant]);

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant) {
      const variant = product.variants?.find(v => v.id === selectedVariant);
      if (variant) return variant.stock;
    }
    return product.stock;
  }, [product, selectedVariant]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-secondary/10 border-t-primary rounded-full"
        />
        <p className="mt-4 text-gray-500 font-bold animate-pulse">{t('loading_product_details')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('product_not_found')}</h2>
        <Link to="/" className="text-secondary mt-4 inline-block">{t('return_to_home')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <BackButton />
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="transition-colors">{t('home')}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="transition-colors cursor-pointer">{product.category}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="whileInView"
        className="grid grid-cols-1 lg:grid-cols-2 gap-12"
      >
        {/* Image Gallery */}
        <motion.div variants={fadeInUp} className="space-y-4">
          <motion.div 
            layoutId={`product-image-${product.id}`}
            className="aspect-square rounded-3xl overflow-hidden bg-white border border-border shadow-sm group"
          >
            <img 
              src={product.images[activeImage]} 
              alt={product.name}
              className="w-full h-full object-contain p-4 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImage === i ? 'border-secondary' : 'border-border opacity-60'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div variants={fadeInUp} className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-secondary font-bold text-sm tracking-wide ">{product.category}</span>
              <div className="flex gap-4">
                <button className="text-gray-400 transition-colors"><Share className="w-5 h-5" /></button>
                <button 
                  onClick={() => toggleWishlist(product)}
                  className={`transition-colors ${isInWishlist(product.id) ? 'text-secondary' : 'text-gray-400'}`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex text-secondary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">1811 {t('ratings')}</span>
              <div className="h-3 w-[1px] bg-gray-200" />
              <button className="text-xs text-secondary font-bold">
                {product.brand || t('no_brand')}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-secondary">NPR {currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 line-through">NPR {(currentPrice * 1.69).toLocaleString()}</span>
              <span className="text-xs font-bold text-gray-900">-69%</span>
            </div>
          </div>

          {/* Color Family Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-gray-500  ">{t('color_family')}</h4>
                <span className="text-xs font-bold text-gray-900">{selectedColor || t('select')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all p-0.5 ${
                      selectedColor === color ? 'border-secondary' : 'border-border'
                    }`}
                  >
                    <div className="w-full h-full rounded-md" style={{ backgroundColor: color }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500  ">{t('size')}</h4>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3rem] px-4 py-2 rounded-md border text-xs font-bold transition-all ${
                      selectedSize === size 
                        ? 'border-secondary bg-secondary/5 text-secondary' 
                        : 'border-border bg-white text-gray-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-900  ">{t('options')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${
                      selectedVariant === variant.id 
                        ? 'border-secondary bg-secondary/5' 
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div>
                      <p className={`font-bold ${selectedVariant === variant.id ? 'text-secondary' : 'text-gray-900'}`}>
                        {variant.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {variant.stock > 0 ? `${variant.stock} ${t('units_available')}` : t('out_of_stock')}
                      </p>
                    </div>
                    <span className="text-sm font-black text-gray-900">
                      {variant.priceDifference > 0 ? `+ NPR ${variant.priceDifference.toLocaleString()}` : 
                       variant.priceDifference < 0 ? `- NPR ${Math.abs(variant.priceDifference).toLocaleString()}` : 
                       'Base Price'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Description */}
          <div className="pt-6 border-t border-border">
            <h4 className="text-xs font-bold text-gray-900   mb-4">{t('product_detail')}</h4>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
              {product.description}
            </p>
          </div>

          {/* Delivery & Service Panel */}
          <div className="p-5 bg-surface rounded-2xl border border-border space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-gray-900">{t('delivery_options')}</span>
                  <Info className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 text-[11px] text-gray-600">
                    Bagmati, Kathmandu Metro 22 - Newroad Area, Newroad
                  </div>
                  <button className="text-[11px] font-bold text-secondary  ">{t('change')}</button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-border pt-4">
              <Truck className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-900">{t('standard_delivery')}</span>
                  <span className="text-xs font-bold text-gray-900">Rs. 95</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{t('guaranteed_by')} 20-21 Apr</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border z-40 sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:flex-row sm:pt-6">
            <button 
              onClick={() => {
                addToCart(product, { 
                  color: selectedColor, 
                  size: selectedSize, 
                  quantity,
                  variantId: selectedVariant 
                });
                navigate('/cart');
              }}
              disabled={currentStock === 0 || (product.variants && product.variants.length > 0 && !selectedVariant)}
              className="flex-1 bg-secondary text-white px-8 py-4 rounded-xl font-bold   text-sm transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {t('buy_now')}
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => addToCart(product, { 
                  color: selectedColor, 
                  size: selectedSize, 
                  quantity,
                  variantId: selectedVariant 
                })}
                disabled={currentStock === 0 || (product.variants && product.variants.length > 0 && !selectedVariant)}
                className="flex-1 sm:flex-initial sm:px-10 py-4 bg-secondary text-white rounded-xl font-bold   text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="sm:hidden">{t('cart')}</span>
              </button>
              <button 
                onClick={() => navigate(`/chat?vendorId=${product.vendorId}&vendor=${encodeURIComponent(product.vendorName)}&product=${encodeURIComponent(product.name)}`)}
                className="flex-1 sm:flex-initial sm:px-10 py-4 bg-white border border-border text-gray-900 rounded-xl font-bold   text-sm transition-all flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5 text-secondary" />
                <span className="sm:hidden">{t('chat')}</span>
                <span className="hidden lg:inline">{t('chat_with_seller')}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
            <button className="flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors">
              <Ruler className="w-4 h-4" />
              {t('size_guide')}
            </button>
            <button 
              onClick={() => toggleWishlist(product)}
              className="flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              {isInWishlist(product.id) ? t('remove_from_wishlist') : t('add_to_wishlist')}
            </button>
            <button className="flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors">
              <Share className="w-4 h-4" />
              {t('share_product')}
            </button>
          </div>

          {/* Vendor Info Section */}
          {vendor && (
            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-50 shadow-sm transition-transform">
                    <img 
                      src={vendor.logoUrl || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&h=100&fit=crop"} 
                      alt={vendor.storeName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900 text-lg transition-colors">
                        {vendor.storeName}
                      </h3>
                      <div className={`w-2 h-2 rounded-full ${vendor.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{t('verified_local_vendor')}</p>
                  </div>
                </div>
                <Link 
                  to={`/vendor/${vendor.storeSlug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-secondary rounded-xl text-sm font-bold transition-all"
                >
                  {t('visit_store')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => toggleCompare(product)}
              className={`flex-1 px-8 py-5 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 ${
                isInCompare(product.id)
                  ? 'bg-secondary text-white'
                  : 'bg-white text-gray-900 border border-gray-100'
              }`}
            >
              <Scale className="w-6 h-6" />
              {isInCompare(product.id) ? t('comparing') : t('compare')}
            </button>
            <button 
              onClick={() => navigate(`/chat?vendorId=${product.vendorId}&vendor=${encodeURIComponent(product.vendorName)}&product=${encodeURIComponent(product.name)}`)}
              className="flex-1 bg-secondary text-white px-8 py-5 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              {t('chat_with_seller')}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-[10px] font-black  er text-gray-500">{t('secure_payment')}</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-[10px] font-black  er text-gray-500">{t('fast_delivery')}</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-[10px] font-black  er text-gray-500">{t('local_artisan')}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => navigate(`/chat?vendorId=${product.vendorId}&vendor=${encodeURIComponent(product.vendorName)}&product=${encodeURIComponent(product.name)}`)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-secondary text-white rounded-full shadow-2xl shadow-secondary/40 flex items-center justify-center transition-colors group"
      >
        <MessageCircle className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
      </motion.button>
    </div>
  );
};



