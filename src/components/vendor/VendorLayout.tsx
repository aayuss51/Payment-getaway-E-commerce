import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search,
  MessageSquare,
  Share2,
  Truck,
  ChevronRight,
  User,
  Store,
  Calculator,
  Shield,
  Star,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NetPayoutCalculator } from './NetPayoutCalculator';

interface VendorLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  commissionRate: number;
  notifications: any[];
  lowStockProducts: any[];
  onMarkRead: (id: string) => void;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  commissionRate,
  notifications,
  lowStockProducts,
  onMarkRead
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, sub: 'Dashboard' },
    { id: 'products', label: 'Products', icon: Package, sub: 'Inventory' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, sub: 'Sales' },
    { id: 'chats', label: 'Chats', icon: MessageSquare, sub: 'Messages' },
    { id: 'notifications', label: 'Notifications', icon: Bell, sub: 'Alerts' },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp, sub: 'Hisab-Kitab' },
    { id: 'logistics', label: 'Logistics', icon: Truck, sub: 'Delivery' },
    { id: 'marketing', label: 'Marketing', icon: Share2, sub: 'Share Kit' },
    { id: 'reviews', label: 'Reviews', icon: Star, sub: 'Feedback' },
    { id: 'gateways', label: 'Gateways', icon: Wallet, sub: 'Payments' },
    { id: 'settings', label: 'Settings', icon: Settings, sub: 'Store' },
    { id: 'store-profile', label: 'Store Profile', icon: Store, sub: 'Customise' },
    { id: 'support', label: 'Support', icon: Shield, sub: 'Assistance' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-secondary/20">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-gray-900 ">Vendor Center</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar / Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={`fixed md:sticky top-0 left-0 h-screen w-80 bg-white border-r border-gray-100 z-[60] flex flex-col p-8 space-y-10 overflow-y-auto ${
              !isSidebarOpen && 'hidden md:flex'
            }`}
          >
            {/* Close button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden absolute top-8 right-8 p-2 text-gray-400 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Logo Section */}
            <div className="hidden md:flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-secondary/20 shrink-0">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900  leading-none">Bazaar</h1>
                <p className="text-[10px] text-secondary font-black   mt-1">Vendor Center</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group ${
                    activeTab === item.id 
                      ? 'bg-secondary text-white shadow-xl shadow-secondary/10' 
                      : 'text-gray-400'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    activeTab === item.id ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black ">{item.label}</p>
                    <p className={`text-[10px] font-bold   ${
                      activeTab === item.id ? 'text-gray-400' : 'text-gray-300'
                    }`}>{item.sub}</p>
                  </div>
                  {item.id === 'notifications' && (notifications.some(n => !n.read) || lowStockProducts.length > 0) && (
                    <div className="ml-auto w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
                  )}
                  {activeTab === item.id && (
                    <motion.div layoutId="active-pill" className="ml-auto">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </motion.div>
                  )}
                </button>
              ))}
              
              <Link
                to="/orders"
                className="w-full flex items-center gap-4 p-4 rounded-3xl transition-all group text-gray-400"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-50 transition-all">
                  <Package className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black ">My Orders</p>
                  <p className="text-[10px] text-gray-300 font-bold  ">Purchases</p>
                </div>
              </Link>
            </nav>

            {/* Net Payout Calculator Widget */}
            <div className="pt-6 border-t border-gray-50">
              <NetPayoutCalculator commissionRate={commissionRate} />
            </div>

            {/* User Profile & Logout */}
            <div className="pt-6 border-t border-gray-50 space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 bg-gray-100 rounded-[1.25rem] flex items-center justify-center text-gray-400 overflow-hidden">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{profile?.displayName || 'Vendor'}</p>
                  <p className="text-[10px] text-gray-400 font-bold   truncate">{profile?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 rounded-3xl text-red-500 transition-all font-black text-[10px]  "
              >
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                Logout Account
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-12 space-y-12">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl font-black text-gray-900  capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-gray-400 font-medium mt-1">
              Namaste, {profile?.displayName?.split(' ')[0] || 'Vendor'}! Welcome back to your store.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search anything..."
                className="bg-white border border-gray-100 rounded-[1.5rem] pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-secondary transition-all w-64 shadow-sm"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-4 bg-white border border-gray-100 rounded-[1.5rem] transition-all shadow-sm relative ${isNotificationsOpen ? 'text-secondary ring-2 ring-secondary/20' : 'text-gray-400'}`}
              >
                <Bell className={`w-6 h-6 ${(!notifications.every(n => n.read) || lowStockProducts.length > 0) ? 'animate-bounce' : ''}`} />
                {(!notifications.every(n => n.read) || lowStockProducts.length > 0) && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsNotificationsOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] border border-gray-100 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0">
                        <h3 className="text-lg font-black text-gray-900 ">Notifications</h3>
                        <button 
                          onClick={() => onTabChange('notifications')}
                          className="text-[10px] font-black text-secondary  "
                        >
                          View All
                        </button>
                      </div>

                      <div className="max-h-[32rem] overflow-y-auto p-4 space-y-2">
                        {/* Static Admin Alerts / Remarks */}
                        {notifications.length === 0 && lowStockProducts.length === 0 && (
                          <div className="py-12 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Bell className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-400">No new alerts for you.</p>
                          </div>
                        )}

                        {/* Low Stock Alerts */}
                        {lowStockProducts.map((product) => (
                          <div key={`low-stock-${product.id}`} className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex gap-4 transition-all">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-red-700   mb-0.5">Low Stock Alert</p>
                              <p className="text-sm text-gray-900 font-bold leading-tight">{product.name}</p>
                              <p className="text-[10px] text-gray-500 font-medium mt-1">Only {product.stock} items left in stock.</p>
                              <button 
                                onClick={() => {
                                  onTabChange('products');
                                  setIsNotificationsOpen(false);
                                }}
                                className="mt-2 text-[10px] font-black text-red-600  "
                              >
                                Restock Now
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Admin Notifications */}
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 rounded-2xl transition-all flex gap-4 border ${
                              notification.read ? 'bg-white border-transparent opacity-60' : 'bg-red-50/30 border-red-100'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              notification.type === 'info' ? 'bg-red-50 text-red-600' :
                              notification.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                              'bg-red-100 text-secondary'
                            }`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-xs font-black text-gray-900  ">Admin Remark</p>
                                <span className="text-[9px] font-bold text-gray-400 capitalize">{new Date(notification.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-gray-900 font-bold leading-tight truncate">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notification.message}</p>
                              {!notification.read && (
                                <button 
                                  onClick={() => onMarkRead(notification.id)}
                                  className="mt-2 text-[10px] font-black text-secondary  "
                                >
                                  Mark as Read
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>


          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};



