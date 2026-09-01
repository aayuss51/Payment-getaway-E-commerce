import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, ChevronDown, X, LayoutGrid, List, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

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

const CATEGORIES = ['All', 'Fashion', 'Electronics', 'Home Decor', 'Food & Beverage', 'Beauty', 'Sports'];

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
    status: 'active',
    rating: 4.8,
    reviewsCount: 124
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
    status: 'active',
    rating: 4.5,
    reviewsCount: 89
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
    status: 'active',
    rating: 4.9,
    reviewsCount: 256
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
    status: 'active'
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
    status: 'active'
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
    status: 'active'
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
    status: 'active'
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

export const Store = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [pageCursors, setPageCursors] = useState<any[]>([]);
  const pageSize = 9;

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && CATEGORIES.includes(cat)) {
      setSelectedCategory(cat);
    }
    
    const queryParam = searchParams.get('q');
    if (queryParam !== null) {
      setSearchQuery(queryParam);
    }
  }, [searchParams]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setPageCursors([]);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  const fetchProducts = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    setLoading(true);
    try {
      const productsPath = 'products';
      let baseQuery = query(
        collection(db, productsPath), 
        where('status', '==', 'active')
      );

      // Note: We'll filter approvalStatus client-side if needed or just show all for now since products might be missing this field
      // Base query for count
      if (selectedCategory !== 'All') {
        baseQuery = query(baseQuery, where('category', '==', selectedCategory));
      }

      // Get count
      let count = 0;
      try {
        const countSnapshot = await getCountFromServer(baseQuery);
        count = countSnapshot.data().count;
      } catch (e) {
        console.warn("Count failed, using fallback");
      }
      setTotalProducts(count);

      // Apply sorting
      let finalQuery;
      if (sortBy === 'price-low') {
        finalQuery = query(baseQuery, orderBy('price', 'asc'));
      } else if (sortBy === 'price-high') {
        finalQuery = query(baseQuery, orderBy('price', 'desc'));
      } else {
        // Newest first - try createdAt, fallback to name
        finalQuery = query(baseQuery, orderBy('createdAt', 'desc'));
      }

      // Apply pagination
      if (direction === 'next' && lastVisible) {
        finalQuery = query(finalQuery, startAfter(lastVisible), limit(pageSize));
      } else if (direction === 'prev' && pageCursors[currentPage - 2]) {
        finalQuery = query(finalQuery, startAfter(pageCursors[currentPage - 2]), limit(pageSize));
      } else if (direction === 'prev' && currentPage === 2) {
        finalQuery = query(finalQuery, limit(pageSize));
      } else {
        finalQuery = query(finalQuery, limit(pageSize));
      }

      let querySnapshot;
      try {
        querySnapshot = await getDocs(finalQuery);
      } catch (err) {
        console.error("Primary query failed, falling back to name sort:", err);
        // Fallback to name sort if createdAt sort requires an index that's missing
        const fallbackFinal = query(baseQuery, orderBy('name', 'asc'), limit(pageSize));
        querySnapshot = await getDocs(fallbackFinal);
      }
      
      if (querySnapshot.empty) {
        if (direction === 'initial') {
           setProducts([]);
        }
      } else {
        const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Product));
        setProducts(fetchedProducts);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
        
        if (direction === 'initial') {
          setPageCursors([]);
        } else if (direction === 'next') {
          setPageCursors(prev => [...prev, lastVisible]);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts(MOCK_PRODUCTS.slice(0, pageSize));
      setTotalProducts(MOCK_PRODUCTS.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts('initial');
    setCurrentPage(1);
    setPageCursors([]);
  }, [selectedCategory, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage) {
      fetchProducts('next');
    } else {
      fetchProducts('prev');
    }
    setCurrentPage(newPage);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter (client-side for now as Firestore doesn't support partial text search well without extra tools)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Price filter (client-side as we already fetched a page)
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    return result;
  }, [products, searchQuery, priceRange]);

  return (
    <div className="min-h-screen bg-[#F6F6F7] pb-20">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-border py-12 mb-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-extrabold text-gray-900  mb-2">{t('collections')}</h1>
              <p className="text-sm font-medium text-gray-500  ">{selectedCategory !== 'All' ? t(selectedCategory === 'All' ? 'all' : `cat_${selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '')}`) : t('all_products')}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t('search_products')}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val) {
                      searchParams.set('q', val);
                    } else {
                      searchParams.delete('q');
                    }
                    setSearchParams(searchParams, { replace: true });
                  }}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-border rounded-lg focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none text-sm"
                />
              </div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold transition-all ${isFilterOpen ? 'bg-secondary border-secondary text-white' : 'bg-white border-border text-gray-700 hover:border-gray-400'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t('filter')}</span>
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 space-y-10 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold text-gray-900   mb-4">{t('categories')}</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat 
                        ? 'bg-secondary text-white font-bold' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {t(cat === 'All' ? 'all' : `cat_${cat.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '')}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-xs font-bold text-gray-900   mb-4">{t('price')}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">NPR</span>
                      <input 
                        type="number" 
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-full pl-11 pr-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
                      />
                    </div>
                    <label className="text-[10px] font-medium text-gray-500 mt-1 block px-1">{t('min_price')}</label>
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">NPR</span>
                      <input 
                        type="number" 
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full pl-11 pr-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
                      />
                    </div>
                    <label className="text-[10px] font-medium text-gray-500 mt-1 block px-1">{t('max_price')}</label>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 space-y-6">
            {/* Sort & Stats */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <p className="text-sm font-medium text-gray-500">
                {filteredProducts.length} {t('products')}
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-400  ">{t('sort_by')}</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border border-border rounded-md px-2 py-1 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
                  >
                    <option value="newest">{t('newest_first')}</option>
                    <option value="price-low">{t('price_low_high')}</option>
                    <option value="price-high">{t('price_high_low')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-100 rounded-[2rem] animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <motion.div 
                  variants={staggerContainer}
                  initial="initial"
                  animate="whileInView"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredProducts.map((product) => (
                    <motion.div key={product.id} variants={fadeInUp}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalProducts > pageSize && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="p-4 rounded-full bg-paper border border-red-200 shadow-sm text-primary hover:bg-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                      {[...Array(Math.ceil(totalProducts / pageSize))].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 || 
                          pageNum === Math.ceil(totalProducts / pageSize) || 
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                if (pageNum !== currentPage) {
                                  if (pageNum === currentPage + 1) handlePageChange(pageNum);
                                  if (pageNum === currentPage - 1) handlePageChange(pageNum);
                                  if (pageNum === 1) {
                                    setCurrentPage(1);
                                    setPageCursors([]);
                                    fetchProducts('initial');
                                  }
                                }
                              }}
                              className={`w-12 h-12 rounded-full font-serif text-lg transition-all duration-500 flex items-center justify-center ${
                                currentPage === pageNum 
                                  ? 'bg-secondary text-white shadow-xl shadow-secondary/20 scale-110' 
                                  : 'bg-paper text-primary hover:bg-red-50 border border-red-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="text-gold-300 font-serif">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage * pageSize >= totalProducts || loading}
                      className="p-4 rounded-full bg-paper border border-red-200 shadow-sm text-primary hover:bg-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-32 bg-paper rounded-[4rem] lux-border relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gold-400/5 rounded-full -translate-y-1/2 -translate-x-1/2" />
                <div className="w-24 h-24 bg-red-50/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-100">
                  <Search className="w-10 h-10 text-gold-300" />
                </div>
                <h3 className="text-3xl font-serif text-primary">{t('no_products_found')}</h3>
                <p className="text-sm text-gray-400 mt-3 font-serif max-w-sm mx-auto">{t('try_adjusting_filters')}</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setPriceRange([0, 100000]);
                  }}
                  className="mt-10 px-10 py-4 bg-secondary text-white rounded-full text-[10px] font-bold   hover:opacity-90 transition-all duration-500 lux-shadow"
                >
                  {t('clear_all_filters')}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};



