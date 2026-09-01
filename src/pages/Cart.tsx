import React from 'react';
import { useCart } from '../context/CartContext';
import { BackButton } from '../components/BackButton';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, Minus, ArrowRight, CreditCard, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const Cart = () => {
  const { t } = useTranslation();
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'eSewa' | 'Khalti' | 'COD'>('eSewa');
  const [error, setError] = React.useState<string | null>(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setError(null);
    if (!user) {
      navigate('/login');
      return;
    }

    if (!profile?.address) {
      setError(t('add_address_error'));
      setTimeout(() => navigate('/profile'), 2000);
      return;
    }

    setIsCheckingOut(true);
    try {
      const vendorIds = Array.from(new Set(cart.map(item => item.vendorId)));
      
      const orderData = {
        buyerId: user.uid,
        buyerName: user.displayName || 'Customer',
        items: cart,
        totalAmount: total,
        vendorIds,
        status: 'pending',
        paymentMethod: selectedPaymentMethod,
        shippingAddress: profile.address,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Create pending ledger entries for each vendor
      for (const vendorId of vendorIds) {
        const vendorItems = cart.filter(item => item.vendorId === vendorId);
        const vendorAmount = vendorItems.reduce((sum, item) => {
          const variant = item.selectedVariantId && item.variants 
            ? item.variants.find(v => v.id === item.selectedVariantId) 
            : null;
          const price = item.price + (variant?.priceDifference || 0);
          return sum + (price * item.quantity);
        }, 0);

        // Calculate commission (12%)
        const commission = vendorAmount * 0.12;
        const netAmount = vendorAmount - commission;

        await addDoc(collection(db, 'transactions'), {
          vendorId,
          orderId: orderRef.id,
          amount: netAmount,
          type: 'sale',
          status: 'pending',
          description: `Sale from Order #${orderRef.id.slice(-8).toUpperCase()}`,
          createdAt: new Date().toISOString()
        });
      }
      
      // Clear cart after successful order
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error("Checkout failed:", err);
      setError(t('checkout_failed'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Trash2 className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-3xl font-serif text-primary">{t('cart_empty')}</h1>
        <p className="text-gray-500 font-serif">{t('cart_empty_desc')}</p>
        <Link to="/" className="inline-block bg-secondary text-white px-10 py-4 rounded-full font-bold transition-all lux-shadow   text-[10px]">
          {t('start_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-serif text-primary">{t('shopping_cart', { count: cart.length })}</h1>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gold-400" />
              <p className="text-[10px] font-bold text-gray-400  ">{t('curated_selection')}</p>
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50/50 border border-red-100 p-5 rounded-[2rem] flex items-center gap-3 text-sm text-red-700 font-serif"
            >
              <CreditCard className="w-5 h-5" /> {error}
            </motion.div>
          )}
          
          <div className="space-y-6">
            {cart.map((item) => {
              const itemKey = `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}-${item.selectedVariantId || ''}`;
              const variant = item.selectedVariantId && item.variants 
                ? item.variants.find(v => v.id === item.selectedVariantId) 
                : null;
              const itemPrice = item.price + (variant?.priceDifference || 0);
              
              return (
                <motion.div 
                  key={itemKey}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col sm:flex-row items-center gap-8 bg-paper p-6 rounded-[3rem] lux-border transition-all duration-700 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="w-32 h-32 shrink-0 overflow-hidden rounded-[2rem] lux-border shadow-inner p-1 bg-white">
                    <img src={item.images[0]} className="w-full h-full object-cover rounded-[1.8rem] transition-transform duration-1000" alt={item.name} />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <Link to={`/product/${item.id}`} className="block">
                          <h3 className="font-serif text-2xl text-primary truncate transition-colors  ">{item.name}</h3>
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-bold text-gray-400  ">{t('by')} {item.vendorName}</span>
                          <div className="w-1 h-1 rounded-full bg-gold-300" />
                          <Link 
                            to={`/chat?vendorId=${item.vendorId}&vendor=${encodeURIComponent(item.vendorName || '')}&product=${encodeURIComponent(item.name)}`}
                            className="text-[9px] font-bold text-secondary transition-all flex items-center gap-1.5  "
                          >
                            <MessageSquare className="w-3 h-3" /> {t('consultation')}
                          </Link>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize, item.selectedVariantId)}
                        className="p-3 bg-red-50 text-gold-300 rounded-full transition-all duration-500 border border-red-100"
                        title={t('remove')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {item.selectedColor && (
                        <div className="flex items-center gap-2 bg-paper lux-border px-3 py-1 rounded-full text-[9px] font-bold text-gray-400  ">
                          <div className="w-2 h-2 rounded-full shadow-inner" style={{ backgroundColor: item.selectedColor }} />
                          {item.selectedColor}
                        </div>
                      )}
                      {item.selectedSize && (
                        <div className="bg-paper lux-border px-3 py-1 rounded-full text-[9px] font-bold text-gray-400  ">
                          {item.selectedSize}
                        </div>
                      )}
                      {variant && (
                        <div className="bg-red-50 border border-red-200 px-3 py-1 rounded-full text-[9px] font-bold text-red-700  ">
                          {variant.name}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative group/select">
                          <select 
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value), item.selectedColor, item.selectedSize, item.selectedVariantId)}
                            className="appearance-none bg-paper border border-red-200 rounded-full px-5 py-2 text-[10px] font-bold text-primary focus:ring-2 focus:ring-gold-400 outline-none pr-10 cursor-pointer transition-all  "
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-400 transition-transform">
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-300 font-bold   mb-1">Total Line Item</p>
                        <p className="font-serif text-xl text-primary ">NPR {(itemPrice * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-paper p-10 rounded-[3.5rem] lux-border lux-shadow sticky top-24 space-y-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative space-y-1">
              <h2 className="text-3xl font-serif text-primary">{t('order_summary')}</h2>
              <div className="h-px w-8 bg-gold-400" />
            </div>
            
            <div className="space-y-5 text-sm relative z-10">
              <div className="flex justify-between text-gray-400 font-serif">
                <span>{t('subtotal')}</span>
                <span className="font-sans font-bold text-primary not-italic">NPR {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-serif">
                <span>{t('shipping')}</span>
                <span className="font-sans font-bold text-primary not-italic">NPR 150</span>
              </div>
              <div className="flex justify-between text-gray-400 font-serif">
                <span>{t('tax')}</span>
                <span className="font-sans font-bold text-primary not-italic">NPR {(total * 0.13).toLocaleString()}</span>
              </div>
              <div className="pt-6 border-t border-red-100 flex justify-between items-end">
                <span className="font-bold text-primary   text-[10px]">{t('grand_total')}</span>
                <span className="text-3xl font-serif text-secondary">NPR {(total * 1.13 + 150).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-red-100 space-y-5 relative z-10">
              <h3 className="text-[10px] font-bold text-primary   text-center">{t('select_payment_method')}</h3>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setSelectedPaymentMethod('eSewa')}
                  className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all duration-500 ${
                    selectedPaymentMethod === 'eSewa' 
                      ? 'border-gold-400 bg-red-50/50 shadow-lg' 
                      : 'border-red-100/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img src="https://picsum.photos/seed/esewa/40/40" className="w-8 h-8 rounded-lg grayscale" alt="eSewa" />
                    <span className="font-serif text-lg text-primary">{t('esewa')}</span>
                  </div>
                  {selectedPaymentMethod === 'eSewa' && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-glow" />}
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('Khalti')}
                  className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all duration-500 ${
                    selectedPaymentMethod === 'Khalti' 
                      ? 'border-gold-400 bg-red-50/50 shadow-lg' 
                      : 'border-red-100/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img src="https://picsum.photos/seed/khalti/40/40" className="w-8 h-8 rounded-lg" alt="Khalti" />
                    <span className="font-serif text-lg text-primary">{t('khalti')}</span>
                  </div>
                  {selectedPaymentMethod === 'Khalti' && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-glow" />}
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('COD')}
                  className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all duration-500 ${
                    selectedPaymentMethod === 'COD' 
                      ? 'border-gold-400 bg-red-50/50 shadow-lg' 
                      : 'border-red-100/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="font-serif text-lg text-primary">{t('cash_on_delivery')}</span>
                  </div>
                  {selectedPaymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-glow" />}
                </button>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-secondary text-paper py-5 rounded-full font-bold transition-all duration-700 flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.15)] disabled:opacity-30   text-xs"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> {t('processing')}
                </>
              ) : (
                <>
                  {t('checkout')} <ArrowRight className="w-5 h-5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



