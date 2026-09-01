import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, limit, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, VendorStore, Brand } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Zap, Truck, Star, Building2, Clock, ChevronLeft, ChevronRight, ShoppingBag, Package, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
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
      staggerChildren: 0.15
    }
  },
  viewport: { once: true, margin: "-100px" }
};

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920", // Fashion/Retail
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1920", // Food
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1920", // Electronics
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1920"  // Shopping/Lifestyle
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    vendorId: 'v1',
    vendorName: 'Urban Style',
    name: 'Premium Cotton Hoodie',
    description: 'Soft, breathable premium cotton hoodie perfect for all seasons.',
    price: 2500,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800'],
    stock: 100,
    status: 'active'
  },
  {
    id: '2',
    vendorId: 'v2',
    vendorName: 'Kathmandu Tech',
    name: 'Pro Wireless Earbuds',
    description: 'Crystal clear sound with active noise cancellation and long battery life.',
    price: 5500,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800'],
    stock: 25,
    status: 'active'
  },
  {
    id: '3',
    vendorId: 'v4',
    vendorName: 'Organic Farms',
    name: 'Fresh Himalayan Honey',
    description: '100% pure, raw organic honey harvested from the high altitudes of the Himalayas.',
    price: 850,
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'],
    stock: 50,
    status: 'active'
  },
  {
    id: '4',
    vendorId: 'v3',
    vendorName: 'Smart Gadgets',
    name: 'Ultra Slim Laptop',
    description: 'Powerful performance in a sleek, lightweight design for professionals on the go.',
    price: 85000,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800'],
    stock: 15,
    status: 'active'
  },
  {
    id: '5',
    vendorId: 'v1',
    vendorName: 'Urban Style',
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket with a modern fit.',
    price: 3200,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?auto=format&fit=crop&q=80&w=800'],
    stock: 40,
    status: 'active'
  },
  {
    id: '6',
    vendorId: 'v2',
    vendorName: 'Kathmandu Tech',
    name: 'Smart Watch Series 5',
    description: 'Track your fitness and stay connected with this advanced smartwatch.',
    price: 12000,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
    stock: 30,
    status: 'active'
  },
  {
    id: '7',
    vendorId: 'v4',
    vendorName: 'Organic Farms',
    name: 'Organic Green Tea',
    description: 'Hand-picked green tea leaves from the hills of Ilam.',
    price: 450,
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&q=80&w=800'],
    stock: 100,
    status: 'active'
  },
  {
    id: '8',
    vendorId: 'v3',
    vendorName: 'Smart Gadgets',
    name: 'Bluetooth Speaker',
    description: 'Portable speaker with deep bass and 12-hour battery life.',
    price: 4500,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1608156639585-340049695c73?auto=format&fit=crop&q=80&w=800'],
    stock: 60,
    status: 'active',
    colors: ['#000000', '#FF0000', '#0000FF'],
    sizes: ['Standard', 'Mini']
  },
  {
    id: '9',
    vendorId: 'v1',
    vendorName: 'Urban Style',
    name: 'Leather Boots',
    description: 'Durable and stylish leather boots for any adventure.',
    price: 6500,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1520639889313-7272a74b1c73?auto=format&fit=crop&q=80&w=800'],
    stock: 20,
    status: 'active',
    approvalStatus: 'approved'
  },
  {
    id: '10',
    vendorId: 'v2',
    vendorName: 'Kathmandu Tech',
    name: 'Mechanical Keyboard',
    description: 'Tactile mechanical keyboard with RGB lighting.',
    price: 7500,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800'],
    stock: 15,
    status: 'active'
  },
  {
    id: '11',
    vendorId: 'v4',
    vendorName: 'Organic Farms',
    name: 'Pure Ghee',
    description: 'Traditional home-made pure cow ghee.',
    price: 1200,
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&q=80&w=800'],
    stock: 80,
    status: 'active'
  },
  {
    id: '12',
    vendorId: 'v3',
    vendorName: 'Smart Gadgets',
    name: 'Gaming Mouse',
    description: 'High-precision gaming mouse with customizable buttons.',
    price: 3500,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1527814732934-94a1fe58a93f?auto=format&fit=crop&q=80&w=800'],
    stock: 45,
    status: 'active'
  },
  {
    id: '13',
    vendorId: 'v1',
    vendorName: 'Urban Style',
    name: 'Summer T-Shirt',
    description: 'Lightweight cotton t-shirt for hot summer days.',
    price: 1200,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800'],
    stock: 150,
    status: 'active',
    colors: ['#FFFFFF', '#000000', '#FF0000', '#0000FF', '#FFFF00', '#008000'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: '14',
    vendorId: 'v2',
    vendorName: 'Kathmandu Tech',
    name: 'Noise Cancelling Headphones',
    description: 'Over-ear headphones for an immersive audio experience.',
    price: 15000,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'],
    stock: 10,
    status: 'active'
  },
  {
    id: '15',
    vendorId: 'v4',
    vendorName: 'Organic Farms',
    name: 'Himalayan Pink Salt',
    description: 'Natural pink salt rich in minerals.',
    price: 250,
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1518110168401-f7629d61c385?auto=format&fit=crop&q=80&w=800'],
    stock: 200,
    status: 'active'
  },
  {
    id: '16',
    vendorId: 'v3',
    vendorName: 'Smart Gadgets',
    name: 'External Hard Drive 1TB',
    description: 'Securely store your data with this portable hard drive.',
    price: 8500,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1531492746076-1a1bd9c2527d?auto=format&fit=crop&q=80&w=800'],
    stock: 25,
    status: 'active'
  },
  {
    id: '17',
    vendorId: 'v1',
    vendorName: 'Urban Style',
    name: 'Chino Pants',
    description: 'Comfortable and versatile chino pants for work or play.',
    price: 2800,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800'],
    stock: 55,
    status: 'active',
    colors: ['#8B4513', '#000000', '#2F4F4F'],
    sizes: ['28', '30', '32', '34', '36']
  },
  {
    id: '18',
    vendorId: 'v2',
    vendorName: 'Kathmandu Tech',
    name: 'Webcam 1080p',
    description: 'High-definition webcam for clear video calls.',
    price: 4200,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800'],
    stock: 35,
    status: 'active'
  },
  {
    id: '19',
    vendorId: 'v4',
    vendorName: 'Organic Farms',
    name: 'Dried Apple Slices',
    description: 'Healthy and delicious dried apple snacks.',
    price: 600,
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&q=80&w=800'],
    stock: 90,
    status: 'active'
  },
  {
    id: '20',
    vendorId: 'v3',
    vendorName: 'Smart Gadgets',
    name: 'USB-C Hub',
    description: 'Expand your connectivity with this multi-port USB-C hub.',
    price: 3800,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800'],
    stock: 50,
    status: 'active'
  }
];

export const Home = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [topRatedVendors, setTopRatedVendors] = useState<VendorStore[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [newArrivalsIndex, setNewArrivalsIndex] = useState(0);
  const productsPerPage = 4;
  const maxNewArrivals = 12; // Show 12 products in the slider (3 pages)
  const newArrivals = products.slice(0, maxNewArrivals);
  const featuredProducts = products.filter(p => p.isFeatured).length > 0
    ? products.filter(p => p.isFeatured).slice(0, 8)
    : products.length > maxNewArrivals 
      ? products.slice(maxNewArrivals, maxNewArrivals + 8)
      : products.slice(0, 4);
  const totalPages = Math.ceil(newArrivals.length / productsPerPage);

  const nextSlide = () => {
    if (totalPages === 0) return;
    setNewArrivalsIndex((prev) => (prev + 1) % totalPages);
  };

  const prevSlide = () => {
    if (totalPages === 0) return;
    setNewArrivalsIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 1. Static Data Fetching (Products & Brands)
    const fetchHomeData = async () => {
      try {
        const productsPath = 'products';
        const q = query(
          collection(db, productsPath), 
          where('status', '==', 'active'),
          limit(20)
        );
        let fetchedProducts: Product[] = [];
        try {
          const querySnapshot = await getDocs(q);
          fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, productsPath);
        }
        
        if (fetchedProducts.length === 0) {
          setProducts(MOCK_PRODUCTS);
        } else {
          setProducts(fetchedProducts);
        }

        const brandsPath = 'brands';
        try {
          const brandsSnapshot = await getDocs(collection(db, brandsPath));
          const fetchedBrands = brandsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
          setBrands(fetchedBrands);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, brandsPath);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (products.length === 0) {
          setProducts(MOCK_PRODUCTS.slice(0, 10));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();

    // 2. Real-time Data (Vendors)
    const vendorsPath = 'vendors';
    const vendorsQ = query(collection(db, vendorsPath), where('isTopRated', '==', true), limit(4));
    const unsubscribeVendors = onSnapshot(vendorsQ, (snapshot) => {
      const fetchedVendors = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as VendorStore));
      setTopRatedVendors(fetchedVendors);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, vendorsPath);
    });

    return () => {
      unsubscribeVendors();
    };
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {profile?.hasPendingVendorApplication && (
        <div className="bg-red-50 border-b border-red-100 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-secondary" />
              </div>
              <p className="text-sm font-bold text-secondary">
                {t('application_under_review')}
              </p>
            </div>
            <Link 
              to="/become-vendor" 
              className="text-xs font-black text-secondary   transition-colors"
            >
              {t('view_status')}
            </Link>
          </div>
        </div>
      )}
      <section className="relative h-[80vh] w-full overflow-hidden bg-white">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img 
            key={currentHeroImage}
            src={HERO_IMAGES[currentHeroImage]} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Hero"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center px-6 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 border border-white/20"
          >
            <span className="text-[10px] sm:text-xs font-bold text-white  ">{t('new_arrivals')}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-7xl lg:text-8xl font-black text-white leading-tight  mb-4"
          >
            Modern Retail<br />
            <span className="text-white">Redefined.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-white/90 max-w-xl mb-10 font-medium"
          >
            Discover curated collections from trusted vendors. Quality products, delivered with care.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link 
              to="/store" 
              className="w-full sm:w-auto px-12 py-4 bg-secondary text-white rounded-xl font-bold   text-sm transition-all shadow-xl shadow-secondary/20 flex items-center justify-center"
            >
              {t('shop_now')}
            </Link>
            <Link 
              to="/become-vendor"
              className="w-full sm:w-auto px-12 py-4 border-2 border-white text-white rounded-xl font-bold   text-sm transition-all flex items-center justify-center"
            >
              {t('start_selling')}
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">

      {/* Top Rated Vendors */}
      <motion.section 
        variants={fadeInUp}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-12"
      >
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl sm:text-5xl font-black  text-gray-900">{t('top_rated_vendors')}</h2>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-secondary" />
              <p className="text-[10px] font-bold text-secondary  ">{t('shop_trusted_businesses')}</p>
            </div>
          </div>
          <Link to="/become-vendor" className="text-xs font-bold text-secondary   transition-colors border-b border-secondary/20 pb-1">
            {t('join_as_vendor')}
          </Link>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10"
        >
          {(topRatedVendors.length > 0 ? topRatedVendors.map(v => ({
            name: v.storeName,
            slug: v.storeSlug,
            rating: v.rating || 5.0,
            reviews: v.reviewsCount || 128,
            img: v.topRatedImageUrl || v.logoUrl || v.bannerUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
          })) : [
            { name: 'Urban Style', slug: 'urban-style', rating: 5.0, reviews: 128, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
            { name: 'Kathmandu Tech', slug: 'kathmandu-tech', rating: 4.8, reviews: 256, img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400' },
            { name: 'Organic Farms', slug: 'organic-farms', rating: 4.9, reviews: 89, img: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&q=80&w=400' },
            { name: 'Smart Gadgets', slug: 'smart-gadgets', rating: 4.7, reviews: 164, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' }
          ]).map((vendor, i) => (
            <motion.div 
              key={i} 
              variants={fadeInUp}
              className="group p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm transition-all duration-700 relative overflow-hidden flex flex-col items-center text-center space-y-6"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-1000" />
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-secondary/20 p-1 bg-white shadow-xl transition-colors duration-500">
                  <img 
                    src={vendor.img} 
                    className="w-full h-full rounded-full object-cover transition-transform duration-[1.5s]"
                    alt={vendor.name}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-secondary text-white text-[8px] font-bold px-3 py-1 rounded-full   shadow-lg shadow-secondary/40"
                >
                  {t('verified')}
                </motion.div>
              </div>
              <div className="space-y-1">
                <div className="bg-secondary px-4 py-1 rounded-lg">
                  <h4 className="font-bold text-xl text-white transition-colors  ">{vendor.name}</h4>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex text-secondary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(vendor.rating) ? 'fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-900">{vendor.rating}</span>
                  <span className="text-[10px] text-gray-400   font-medium">({vendor.reviews})</span>
                </div>
              </div>
              <Link 
                to={`/vendor/${vendor.slug}`}
                className="w-full py-4 bg-white border border-secondary/20 text-secondary rounded-full text-[10px] font-bold   transition-all duration-500 text-center relative overflow-hidden"
              >
                <motion.span className="relative z-10">{t('visit_store')}</motion.span>
                <motion.div 
                  className="absolute inset-0 bg-secondary"
                  initial={{ x: "-100%" }}
                  transition={{ duration: 0.4 }}
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Featured Products */}
      <motion.section 
        variants={fadeInUp}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-bold  text-gray-900">{t('featured_products')}</h2>
            <p className="text-sm text-gray-500 font-medium">{t('handpicked_quality')}</p>
          </div>
          <Link to="/store" className="group flex items-center gap-2 text-secondary font-bold transition-all text-xs   pb-1 border-b-2 border-secondary/20">
            {t('view_all')} <ArrowRight className="w-4 h-4 transition-transform" />
          </Link>
        </div>

        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8sm:gap-12"
        >
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </motion.section>

      {/* Categories */}
      <motion.section 
        variants={fadeInUp}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-8"
      >
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{t('shop_by_category')}</h2>
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4"
        >
          {[
            { name: t('cat_fashion'), techName: 'Fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=400' },
            { name: t('cat_electronics'), techName: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=400' },
            { name: t('cat_home'), techName: 'Home Decor', img: 'https://images.unsplash.com/photo-1513519247388-4e282a142d62?auto=format&fit=crop&q=80&w=400' },
            { name: t('cat_food'), techName: 'Food', img: 'https://images.unsplash.com/photo-1506617564039-2f3b650ad701?auto=format&fit=crop&q=80&w=400' },
            { name: t('cat_beauty'), techName: 'Beauty', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400' },
            { name: t('cat_sports'), techName: 'Sports', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400' }
          ].map((cat, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <Link 
                to={`/store?category=${cat.techName}`}
                className="group relative h-32 rounded-2xl overflow-hidden bg-gray-100 block"
              >
                <img 
                  src={cat.img} 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-500"
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-bold text-gray-900 transition-colors  text-[10px] ">{cat.name}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Trusted Brands Slider */}
      {brands.length > 0 && (
        <section className="space-y-12 py-16 bg-gray-50/50 -mx-4 px-4 sm:-mx-12 sm:px-12 rounded-[4rem]">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-gray-900">{t('trusted_platforms')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {t('partner_desc')}
            </p>
          </div>

          <div className="relative overflow-hidden group">
            <motion.div 
              className="flex gap-12 items-center"
              animate={{ 
                x: [0, -100 * brands.length] 
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              {/* Duplicate brands for infinite loop */}
              {[...brands, ...brands, ...brands].map((brand, i) => (
                <div 
                  key={`${brand.id}-${i}`} 
                  className="flex-shrink-0 flex flex-col items-center gap-4 group/brand"
                >
                  <div className="w-48 h-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center p-6 grayscale transition-all duration-500">
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-400   opacity-0 transition-opacity">
                    {brand.name}
                  </span>
                </div>
              ))}
            </motion.div>
            
            {/* Gradient Overlays for smooth fade */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
          </div>
        </section>
      )}
      </div>
    </div>
  );
};



