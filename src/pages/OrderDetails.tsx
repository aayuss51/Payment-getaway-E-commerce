import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { BackButton } from '../components/BackButton';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Store, ChevronRight, Loader2, Truck, CheckCircle2, ExternalLink, Clock, Copy, Check, Star } from 'lucide-react';
import { ReviewModal } from '../components/ReviewModal';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const OrderDetails = () => {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reviewedVendors, setReviewedVendors] = useState<string[]>([]);
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; vendorId: string; vendorName: string } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'pending':
      case 'paid':
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
          setOrder(orderData);

          // Fetch existing reviews for this order
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('orderId', '==', orderId)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const reviewed = reviewsSnapshot.docs.map(doc => doc.data().vendorId);
          setReviewedVendors(reviewed);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
        <p className="text-gray-500 font-serif italic">{t('loading_order_details')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-6">
        <h1 className="text-3xl font-serif italic text-primary">{t('product_not_found')}</h1>
        <p className="text-gray-500 font-serif italic">{t('order_not_found_desc')}</p>
        <Link to="/orders" className="inline-block bg-secondary text-white px-10 py-4 rounded-full font-bold transition-all lux-shadow   text-[10px]">
          {t('back_to_my_orders')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
      <BackButton label={t('back_to_my_orders')} to="/orders" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif italic text-primary leading-tight">{t('order_id', { id: order.id.slice(-8).toUpperCase() })}</h1>
          <p className="text-secondary text-[10px] font-bold   mt-2 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> 
            {new Date(order.createdAt).toLocaleDateString(i18n.language === 'ne' ? 'ne-NP' : 'en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-5 py-2 rounded-full text-[10px] font-bold   ${
            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
            order.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-red-50 text-secondary border border-red-100'
          }`}>
            {t(order.status === 'processing' ? 'processing_status' : order.status)}
          </span>
        </div>
      </div>

      {/* Tracking Status Section */}
      <div className="bg-paper rounded-[3rem] lux-border p-10 shadow-sm space-y-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-serif italic text-primary flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50/50 rounded-2xl flex items-center justify-center border border-red-100">
                <Truck className="w-6 h-6 text-secondary" />
              </div>
              {t('order_tracking')}
            </h2>
            <p className="text-gray-400 text-xs font-serif italic ml-15">{t('track_journey_desc')}</p>
          </div>

          {order.trackingNumber && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 group">
                <div>
                  <span className="text-[10px] font-black text-gray-400   block mb-1">{t('tracking_number')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-gray-900 font-mono">{order.trackingNumber}</span>
                    <button 
                      onClick={() => copyToClipboard(order.trackingNumber!)}
                      className="p-1.5 rounded-lg transition-colors text-gray-400"
                      title="Copy tracking number"
                    >
                      {copied ? <Check className="w-4 h-4 text-red-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {order.carrier && (
                  <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                )}
                {order.carrier && (
                  <div className="hidden sm:block">
                    <span className="text-[10px] font-black text-gray-400   block mb-1">{t('carrier')}</span>
                    <span className="text-sm font-bold text-gray-900">{order.carrier}</span>
                  </div>
                )}
              </div>
              
              {order.trackingUrl && (
                <a 
                  href={order.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-red-600 text-white px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {t('track_on_carrier')} <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="relative pt-10 pb-4 px-4">
          {/* Progress Bar Background */}
          <div className="absolute top-[44px] left-8 right-8 h-2 bg-gray-100 rounded-full hidden md:block" />
          
          {/* Active Progress Bar */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, ((getStatusStep(order.status) - 1) / 3) * 100)}%` }}
            transition={{ duration: 2.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute top-[44px] left-8 h-2 bg-secondary rounded-full hidden md:block shadow-[0_0_15px_rgba(185,28,28,0.4)]"
          />

          <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
            {[
              { label: t('processing_status'), icon: Clock, step: 1, desc: t('order_is_being_prepared') },
              { label: t('shipped'), icon: Package, step: 2, desc: t('handed_over_to_carrier') },
              { label: t('out_for_delivery'), icon: Truck, step: 3, desc: t('package_is_with_courier') },
              { label: t('delivered'), icon: CheckCircle2, step: 4, desc: t('package_has_arrived') },
            ].map((milestone, i) => {
              const currentStep = getStatusStep(order.status);
              const isCompleted = currentStep >= milestone.step;
              const isActive = currentStep === milestone.step;

              return (
                <div key={i} className="flex md:flex-col items-center gap-4 md:gap-8 relative group">
                  {/* Vertical line for mobile */}
                  {i < 3 && (
                    <div className={`absolute left-7 top-14 w-1 h-14 md:hidden transition-colors duration-1000 ${
                      currentStep > milestone.step ? 'bg-secondary' : 'bg-red-100'
                    }`} />
                  )}

                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isActive ? 1.2 : 1,
                      backgroundColor: isCompleted ? '#b91c1c' : '#ffffff',
                      borderColor: isCompleted ? '#fee2e2' : '#f3f4f6'
                    }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 z-10 transition-all duration-1000 shadow-sm ${
                      isCompleted ? 'text-white' : 'text-red-200'
                    } ${isActive ? 'ring-8 ring-red-50 shadow-xl shadow-red-100' : ''}`}
                  >
                    <milestone.icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                  </motion.div>

                  <div className="md:text-center space-y-1">
                    <p className={`text-[9px] font-bold   transition-colors duration-1000 ${
                      isCompleted ? 'text-secondary' : 'text-gray-300'
                    }`}>
                      {milestone.label}
                    </p>
                    <p className="text-[10px] text-gray-400 font-serif italic md:max-w-[120px] leading-tight">
                      {milestone.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-paper rounded-[3rem] lux-border overflow-hidden shadow-sm">
            <div className="p-8 border-b border-red-100 bg-red-50/10">
              <h2 className="text-xl font-serif italic text-primary flex items-center gap-3">
                <Package className="w-5 h-5 text-secondary" /> {t('order_items')}
              </h2>
            </div>
            <div className="divide-y divide-red-50">
              {order.items.map((item, i) => (
                <div key={i} className="p-8 flex gap-8 items-center group">
                  <div className="w-24 h-24 overflow-hidden rounded-[2rem] border border-red-100 p-1 bg-white shrink-0">
                    <img src={item.images[0]} className="w-full h-full object-cover rounded-[1.8rem] transition-transform duration-1000" alt={item.name} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif italic text-xl text-primary  ">{item.name}</h4>
                    <p className="text-[10px] text-secondary font-bold   flex items-center gap-2 mt-2">
                      <Store className="w-3 h-3" /> {item.vendorName}
                    </p>
                    <div className="mt-4 flex justify-between items-end">
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-gray-400  ">{t('qty')}: {item.quantity}</span>
                        {order.status === 'delivered' && (
                          <button
                            disabled={reviewedVendors.includes(item.vendorId)}
                            onClick={() => setReviewModal({ 
                              isOpen: true, 
                              vendorId: item.vendorId, 
                              vendorName: item.vendorName || 'Vendor' 
                            })}
                            className={`flex items-center gap-2 text-[10px] font-bold   transition-all duration-500 ${
                              reviewedVendors.includes(item.vendorId)
                                ? 'text-emerald-500'
                                : 'text-secondary'
                            }`}
                          >
                            {reviewedVendors.includes(item.vendorId) ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> {t('reviewed')}</>
                            ) : (
                              <><Star className="w-3.5 h-3.5" /> {t('review_store')}</>
                            )}
                          </button>
                        )}
                      </div>
                      <span className="font-serif italic text-2xl text-primary">NPR {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-paper rounded-[3rem] lux-border p-10 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-400/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-2xl font-serif italic text-primary relative z-10">{t('summary')}</h2>
            <div className="space-y-5 text-sm relative z-10">
              <div className="flex justify-between text-gray-400 font-serif italic">
                <span>{t('subtotal')}</span>
                <span className="font-sans font-bold text-primary not-italic">NPR {order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-serif italic">
                <span>{t('shipping')}</span>
                <span className="font-sans font-bold text-primary not-italic">NPR 150</span>
              </div>
              <div className="pt-6 border-t border-red-100 flex justify-between items-end">
                <span className="text-[10px] font-bold text-primary  ">{t('total')}</span>
                <span className="text-3xl font-serif italic text-secondary">NPR {(order.totalAmount + 150).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400   flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {t('shipping_address')}
              </h3>
              <div className="text-sm text-gray-600 leading-relaxed">
                <p className="font-bold text-gray-900">{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                <p>{order.shippingAddress?.zip}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h3 className="text-xs font-black text-gray-400   flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> {t('payment_method')}
              </h3>
              <div className="flex items-center gap-3">
                {order.paymentMethod === 'eSewa' && <img src="https://cdn.iconscout.com/icon/free/png-256/esewa-3-1175111.png" className="h-5" alt="eSewa" />}
                {order.paymentMethod === 'Khalti' && <img src="https://khalti.com/wp-content/uploads/2017/01/khalti-logo.png" className="h-5" alt="Khalti" />}
                {order.paymentMethod === 'COD' && <div className="p-1 bg-red-100 rounded text-red-600"><CreditCard className="w-4 h-4" /></div>}
                <p className="text-sm font-bold text-gray-900">
                  {order.paymentMethod === 'eSewa' ? t('esewa') : order.paymentMethod === 'Khalti' ? t('khalti') : t('cash_on_delivery')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reviewModal && (
        <ReviewModal 
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal(null)}
          vendorId={reviewModal.vendorId}
          vendorName={reviewModal.vendorName}
          orderId={order.id}
          onSuccess={() => {
            setReviewedVendors(prev => [...prev, reviewModal.vendorId]);
          }}
        />
      )}
    </div>
  );
};



