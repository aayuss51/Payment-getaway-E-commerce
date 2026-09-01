import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { BackButton } from '../components/BackButton';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, AlertCircle, Loader2, ExternalLink, Copy, Check } from 'lucide-react';

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const { t } = useTranslation();
  const configs = {
    pending: { icon: Clock, color: 'bg-red-50 text-secondary border border-red-100', label: t('pending') },
    paid: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border border-emerald-100', label: t('paid') },
    processing: { icon: Loader2, color: 'bg-red-50 text-secondary border border-red-100', label: t('processing_status') },
    shipped: { icon: Truck, color: 'bg-secondary text-white border border-secondary', label: t('shipped') },
    out_for_delivery: { icon: Truck, color: 'bg-secondary text-white border border-secondary', label: t('out_for_delivery') },
    delivered: { icon: CheckCircle, color: 'bg-emerald-600 text-white border border-emerald-600', label: t('delivered') },
    cancelled: { icon: XCircle, color: 'bg-red-50 text-red-600 border border-red-100', label: t('cancelled') },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black   ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

export const MyOrders = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('buyerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
        <p className="text-gray-500 font-serif italic">{t('loading_orders')}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
          <Package className="w-10 h-10 text-secondary" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-serif italic text-primary">{t('no_orders_yet')}</h1>
          <p className="text-gray-500 font-serif italic max-w-md mx-auto">{t('no_orders_desc')}</p>
        </div>
        <Link to="/" className="inline-block bg-secondary text-white px-10 py-4 rounded-full font-bold transition-all lux-shadow   text-[10px]">
          {t('start_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12 px-4">
      <BackButton />
      <header>
        <h1 className="text-4xl font-serif italic text-primary ">{t('my_orders_title')}</h1>
        <p className="text-secondary text-[10px] font-bold   mt-2">{t('my_orders_desc')}</p>
      </header>

      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-paper rounded-[2.5rem] lux-border p-8 shadow-sm transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shrink-0 border border-red-50 shadow-sm">
                  <Package className="w-10 h-10 text-red-200" />
                </div>
                <div>
                  <h3 className="font-serif italic text-xl text-primary mb-2  ">{t('order_id', { id: order.id.slice(-8).toUpperCase() })}</h3>
                  <p className="text-[10px] font-bold text-gray-400   flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {t('placed_on', { date: new Date(order.createdAt).toLocaleDateString(i18n.language === 'ne' ? 'ne-NP' : 'en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })})}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 border-red-50 pt-6 md:pt-0">
                <div className="text-right">
                  <p className="text-[9px] text-gray-400  font-bold  mb-1">{t('total_amount')}</p>
                  <p className="text-2xl font-serif italic text-secondary leading-none">NPR {order.totalAmount.toLocaleString()}</p>
                </div>
                <Link 
                  to={`/orders/${order.id}`}
                  className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-200 border border-red-50 transition-all duration-700 shadow-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </Link>
              </div>
            </div>

            {/* Tracking Section */}
            <div className="mt-8 pt-8 border-t border-red-50 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Truck className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-[10px] font-bold   text-primary">{t('order_tracking')}</span>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              {order.trackingNumber ? (
                <div className="bg-white/50 rounded-3xl p-6 flex flex-wrap items-center gap-x-12 gap-y-4 border border-red-50/50">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-400  font-bold ">{t('tracking_number')}</p>
                    <p className="font-sans font-bold text-primary ">{order.trackingNumber}</p>
                  </div>
                  {order.carrier && (
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-400  font-bold ">{t('carrier')}</p>
                      <p className="font-serif italic text-primary">{order.carrier}</p>
                    </div>
                  )}
                  {order.trackingUrl && (
                    <a 
                      href={order.trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-2 text-[10px] font-bold   text-secondary transition-all pr-2"
                    >
                      {t('track_on_carrier')}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4 text-gray-400 bg-white/30 p-6 rounded-3xl border border-red-50/30">
                  <Clock className="w-5 h-5 text-red-200" />
                  <p className="text-xs font-serif italic">
                    {order.status === 'pending' || order.status === 'paid' || order.status === 'processing' 
                      ? t('order_is_being_prepared') 
                      : t('no_tracking_available')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};



