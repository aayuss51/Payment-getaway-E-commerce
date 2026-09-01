import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Cart } from './pages/Cart';
import { VendorDashboard } from './pages/VendorDashboard';
import { BecomeVendor } from './pages/BecomeVendor';
import { AdminDashboard } from './pages/AdminDashboard';
import { Chat } from './pages/Chat';
import { MyOrders } from './pages/MyOrders';
import { OrderDetails } from './pages/OrderDetails';
import { ProductDetails } from './pages/ProductDetails';
import { Wishlist } from './pages/Wishlist';
import { Compare } from './pages/Compare';
import { Profile } from './pages/Profile';
import { VendorStorePage } from './pages/VendorStore';
import { Store } from './pages/Store';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';

// Admin Route Wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

// Placeholder components for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="py-20 text-center">
    <h1 className="text-4xl font-black text-gray-900">{title}</h1>
    <p className="text-gray-500 mt-4">This feature is coming soon in the next update!</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <Router>
              <Layout>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/store" element={<Store />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/vendor/:slug" element={<VendorStorePage />} />
                    <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                    <Route path="/become-vendor" element={<BecomeVendor />} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/orders" element={<MyOrders />} />
                    <Route path="/orders/:orderId" element={<OrderDetails />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/chat" element={<Chat />} />
                  </Routes>
                </ErrorBoundary>
              </Layout>
            </Router>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}



