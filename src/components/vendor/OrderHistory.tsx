import React, { useState, useMemo } from 'react';
import { Order, UserRole } from '../../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  ShoppingBag, 
  Eye, 
  ChevronDown,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderHistoryProps {
  orders: Order[];
  vendorId: string;
  onViewDetails: (order: Order) => void;
}

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const configs = {
    pending: { icon: Clock, color: 'bg-secondary/10 text-secondary', label: 'Pending' },
    paid: { icon: CheckCircle, color: 'bg-red-100 text-red-700', label: 'Paid' },
    processing: { icon: Loader2, color: 'bg-indigo-100 text-indigo-700', label: 'Processing' },
    shipped: { icon: Truck, color: 'bg-purple-100 text-purple-700', label: 'Shipped' },
    delivered: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Delivered' },
    cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
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

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, vendorId, onViewDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter(order => {
        const vendorItems = order.items.filter(item => item.vendorId === vendorId);
        if (vendorItems.length === 0) return false;

        const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        } else {
          const amountA = a.items
            .filter(item => item.vendorId === vendorId)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const amountB = b.items
            .filter(item => item.vendorId === vendorId)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
        }
      });
  }, [orders, vendorId, searchQuery, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-secondary transition-all"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex bg-gray-50 p-1 rounded-2xl shrink-0">
            {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black   transition-all ${
                  statusFilter === status ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Order ID</th>
                <th 
                  className="px-8 py-5 text-[10px] font-black text-gray-400   cursor-pointer transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Date & Time
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'date' ? 'text-secondary' : 'text-gray-300'}`} />
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Items</th>
                <th 
                  className="px-8 py-5 text-[10px] font-black text-gray-400   cursor-pointer transition-colors"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center gap-2">
                    Total Amount
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'amount' ? 'text-secondary' : 'text-gray-300'}`} />
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400   text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900">No Orders Found</h3>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        Try adjusting your filters or search query to find what you're looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedOrders.map((order) => {
                  const vendorItems = order.items.filter(item => item.vendorId === vendorId);
                  const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  
                  return (
                    <motion.tr 
                      key={order.id} 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <span className="font-mono text-xs font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 transition-colors">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex -space-x-3">
                          {vendorItems.slice(0, 3).map((item, i) => (
                            <div key={i} className="w-10 h-10 rounded-xl border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                              <img src={item.images[0]} className="w-full h-full object-cover" alt="" />
                            </div>
                          ))}
                          {vendorItems.length > 3 && (
                            <div className="w-10 h-10 rounded-xl border-2 border-white bg-secondary text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                              +{vendorItems.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-gray-900">NPR {vendorTotal.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{vendorItems.length} items</p>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => onViewDetails(order)}
                          className="p-3 text-gray-400 rounded-2xl transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



