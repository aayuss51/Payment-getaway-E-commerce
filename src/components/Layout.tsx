import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Store, Search, Menu, X, LogOut, LayoutDashboard, Heart, MessageSquare, Package, Languages, ChevronDown as ChevronDownIcon, Facebook, Twitter, Instagram, Youtube, Home as HomeIcon, Clock, Scale, ShoppingBag, Zap, LayoutGrid, ChevronRight as ChevronRightIcon, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SupportBot } from './SupportBot';
import { CategoryNav, MobileCategoryOverlay } from './CategoryNav';

export const Navbar = () => {
  const { profile, isAdmin, isVendor, vendorSlug } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { compareList } = useCompare();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
  const suggestions = React.useMemo(() => [
    t('search_suggestion_1'),
    t('search_suggestion_2'),
    t('search_suggestion_3'),
    t('search_suggestion_4'),
    t('search_suggestion_5'),
    t('search_suggestion_6'),
    t('search_suggestion_7'),
    t('search_suggestion_8'),
    t('search_suggestion_9'),
    t('search_suggestion_10'),
    t('search_suggestion_11'),
    t('search_suggestion_12'),
  ], [t]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % suggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [suggestions.length]);

  const currentPlaceholder = suggestions[placeholderIndex];
  const [searchValue, setSearchValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/store?q=${encodeURIComponent(searchValue.trim())}`);
      setIsFocused(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg shadow-secondary/20">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black er text-gray-900 transition-colors">
                Bazaar
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-2">
              <CategoryNav />
              <Link to="/store" className="px-4 py-2 text-sm font-semibold text-gray-600 transition-colors">
                {t('store')}
              </Link>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-5 w-[calc(100%-3rem)]">
                <AnimatePresence mode="wait">
                  {!searchValue && !isFocused && (
                    <motion.div
                      key={placeholderIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="text-sm text-gray-400 font-medium whitespace-nowrap"
                    >
                      {currentPlaceholder}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <input 
                type="text" 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none relative z-0"
              />
            </form>
          </div>

          <div className="hidden md:flex items-center gap-5">
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 p-2 rounded-lg text-gray-600 transition-all"
              >
                <Languages className="w-5 h-5" />
                <span className="text-xs font-semibold">{currentLanguage.code.toUpperCase()}</span>
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-32 bg-white border border-border rounded-xl shadow-xl py-1 z-50"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                            i18n.language === lang.code ? 'text-secondary font-bold' : 'text-gray-600'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <Link to="/wishlist" className="relative p-2 text-gray-600">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-secondary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 text-gray-600">
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 bg-secondary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            {profile ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-2 border-l border-border ml-2"
                >
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-gray-700 font-bold overflow-hidden">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      profile.displayName[0]
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl shadow-xl py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-border mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{profile.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                        </div>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 transition-colors flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
                          </Link>
                        )}
                        {isVendor && !isAdmin && (
                          <>
                            <Link to="/vendor-dashboard" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 transition-colors flex items-center gap-2">
                              <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
                            </Link>
                            {vendorSlug && (
                              <Link to={`/vendor/${vendorSlug}`} onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 transition-colors flex items-center gap-2">
                                <Store className="w-4 h-4" /> {t('my_store')}
                              </Link>
                            )}
                          </>
                        )}
                        <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 transition-colors flex items-center gap-2">
                          <User className="w-4 h-4" /> {t('profile_settings')}
                        </Link>
                        <Link to="/orders" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 transition-colors flex items-center gap-2">
                          <Package className="w-4 h-4" /> {t('my_orders')}
                        </Link>
                        <Link to="/chat" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-600 transition-colors flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> {t('chat')}
                        </Link>
                        <button 
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 transition-colors flex items-center gap-2 mt-1 border-t border-border pt-2"
                        >
                          <LogOut className="w-4 h-4" /> {t('logout')}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-2">
                <Link to="/login" className="text-sm font-medium text-gray-600">
                  {t('login')}
                </Link>
                <Link to="/login?mode=register" className="px-6 py-2 bg-secondary text-white font-semibold rounded-lg shadow-sm text-sm">
                  {t('sign_up')}
                </Link>
              </div>
            )}
          </div>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 relative">
                <Search className="w-4 h-4 text-gray-400 z-10" />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-5 w-[calc(100%-3rem)]">
                  <AnimatePresence mode="wait">
                    {!searchValue && !isFocused && (
                      <motion.div
                        key={placeholderIndex}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="text-sm text-gray-400 font-medium whitespace-nowrap"
                      >
                        {currentPlaceholder}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <input 
                  type="text" 
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 relative z-0" 
                />
              </div>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsCategoriesOpen(true);
                }}
                className="flex items-center justify-between w-full gap-2 text-gray-900 py-3 px-4 bg-gray-50 rounded-xl font-bold border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-secondary" /> 
                  <span>Shop by Categories</span>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </button>
              <Link to="/store" className="flex items-center gap-2 text-gray-600 py-2">
                <Store className="w-5 h-5" /> {t('store')}
              </Link>
              <Link to="/cart" className="flex items-center gap-2 text-gray-600 py-2">
                <ShoppingCart className="w-5 h-5" /> {t('cart')} ({cart.length})
              </Link>
              {/* Mobile Language Switcher */}
              <div className="py-2 border-b border-gray-50">
                <p className="text-[10px] font-black text-gray-400   mb-2">Language</p>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        i18n.language === lang.code 
                          ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              {profile ? (
                <>
                  <Link to="/chat" className="flex items-center gap-3 text-gray-600 py-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>{t('chat')}</span>
                  </Link>
                  {!isVendor && !isAdmin && (
                    <>
                      <Link to="/become-vendor" className="flex items-center gap-2 text-secondary py-2 font-bold">
                        <Store className="w-5 h-5" /> {t('sell_on_bazaar')}
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-2 text-gray-600 py-2">
                        <Heart className="w-5 h-5" /> {t('wishlist')}
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2 text-gray-600 py-2">
                      <LayoutDashboard className="w-5 h-5" /> {t('dashboard')}
                    </Link>
                  )}
                  {isVendor && !isAdmin && (
                    <>
                      <Link to="/vendor-dashboard" className="flex items-center gap-2 text-gray-600 py-2">
                        <LayoutDashboard className="w-5 h-5" /> {t('dashboard')}
                      </Link>
                      {vendorSlug && (
                        <Link to={`/vendor/${vendorSlug}`} className="flex items-center gap-2 text-gray-600 py-2">
                          <Store className="w-5 h-5" /> {t('my_store')}
                        </Link>
                      )}
                    </>
                  )}
                  {!isAdmin && (
                    <Link to="/orders" className="flex items-center gap-2 text-gray-600 py-2">
                      <Package className="w-5 h-5" /> {t('my_orders')}
                    </Link>
                  )}
                  <Link to="/profile" className="flex items-center gap-2 text-gray-600 py-2">
                    <User className="w-5 h-5" /> {t('profile_settings')}
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 py-2 w-full text-left">
                    <LogOut className="w-5 h-5" /> {t('logout')}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <Link to="/login" className="block w-full bg-gray-50 text-gray-900 text-center py-3 rounded-xl font-bold border border-gray-200">
                    {t('login')}
                  </Link>
                <Link to="/login?mode=register" className="block w-full bg-secondary text-white text-center py-3 rounded-xl font-bold">
                  {t('sign_up')}
                </Link>
                  <div className="pt-4 border-t border-gray-100">
                    <Link to="/become-vendor" className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <Store className="w-6 h-6 text-secondary" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{t('sell_on_bazaar')}</p>
                        <p className="text-[10px] text-gray-500">{t('start_selling')}</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <MobileCategoryOverlay 
        isOpen={isCategoriesOpen} 
        onClose={() => setIsCategoriesOpen(false)} 
      />
    </nav>
  );
};

export const BottomNav = () => {
  const { t } = useTranslation();
  const { cart } = useCart();
  const { profile } = useAuth();
  
  return (
    <div className="md:hidden fixed bottom-10 left-6 right-6 lux-glass px-8 py-4 flex justify-between items-center z-[90] rounded-[2.5rem] lux-shadow border-red-200/50 transition-all pb-safe">
      <Link to="/" className="flex flex-col items-center gap-1.5 text-gray-400 transition-all duration-300">
        <HomeIcon className="w-5 h-5" />
        <span className="text-[8px] font-bold  ">{t('home')}</span>
      </Link>
      <Link to="/store" className="flex flex-col items-center gap-1.5 text-gray-400 transition-all duration-300">
        <Store className="w-5 h-5" />
        <span className="text-[8px] font-bold  ">{t('store')}</span>
      </Link>
      <Link to="/cart" className="flex flex-col items-center gap-1.5 text-gray-400 transition-all duration-300 relative group">
        <div className="p-1">
          <ShoppingCart className="w-6 h-6 transition-transform" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-secondary text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-paper">
              {cart.length}
            </span>
          )}
        </div>
        <span className="text-[8px] font-bold  ">{t('cart')}</span>
      </Link>
      <Link to="/chat" className="flex flex-col items-center gap-1.5 text-gray-400 transition-all duration-300">
        <MessageSquare className="w-5 h-5" />
        <span className="text-[8px] font-bold  ">{t('chat')}</span>
      </Link>
      <Link to={profile ? "/profile" : "/login"} className="flex flex-col items-center gap-1.5 text-gray-400 transition-all duration-300">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-red-50 border border-red-200 flex items-center justify-center transition-transform">
           {profile?.photoURL ? (
             <img src={profile.photoURL} className="w-full h-full object-cover" />
           ) : (
             <User className="w-4 h-4" />
           )}
        </div>
        <span className="text-[8px] font-bold   leading-none">{profile ? t('profile') : t('login')}</span>
      </Link>
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-paper font-sans pb-28 md:pb-0">
      <Navbar />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "circOut" }}
        className="relative"
      >
        {children}
      </motion.main>
      <SupportBot />
      <BottomNav />
      <footer className="bg-primary text-white pt-20 pb-12 mt-32 hidden md:block border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 group shrink-0 mb-6">
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold  text-white">
                  Bazaar
                </span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                {t('footer_desc')}
              </p>
              <div className="mt-8 flex gap-4">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="p-2 bg-gray-800 rounded-lg text-gray-400 transition-all">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold   text-white mb-6 underline underline-offset-8 decoration-secondary/50">{t('shop')}</h4>
              <ul className="space-y-3">
                <li><Link to="/store" className="text-sm text-gray-400 transition-colors">{t('all_categories')}</Link></li>
                <li><Link to="/store" className="text-sm text-gray-400 transition-colors">{t('featured_products')}</Link></li>
                <li><Link to="/store" className="text-sm text-gray-400 transition-colors">{t('all_vendors')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold   text-white mb-6 underline underline-offset-8 decoration-secondary/50">{t('support')}</h4>
              <ul className="space-y-3">
                <li><Link to="/help" className="text-sm text-gray-400 transition-colors">{t('help_center')}</Link></li>
                <li><Link to="/shipping" className="text-sm text-gray-400 transition-colors">{t('shipping_policy')}</Link></li>
                <li><Link to="/returns" className="text-sm text-gray-400 transition-colors">{t('returns_refunds')}</Link></li>
                <li><Link to="/become-vendor" className="text-secondary font-bold transition-all">{t('become_vendor')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
            <p>© {new Date().getFullYear()} Bazaar Marketplace. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="transition-colors">Privacy Policy</a>
              <a href="#" className="transition-colors">Terms of Service</a>
              <a href="#" className="transition-colors">Cookies Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};



