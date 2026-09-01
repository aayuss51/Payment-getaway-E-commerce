import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Transaction, VendorStore, Payout, Order } from '../../types';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  History,
  Calendar,
  Package,
  CreditCard,
  ChevronRight,
  Wallet,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EarningsDashboardProps {
  vendorProfile: VendorStore;
  payouts?: Payout[];
  orders?: Order[];
  onRequestPayout: () => void;
}

export const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ vendorProfile, payouts = [], orders = [], onRequestPayout }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'cleared'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'transactions'),
          where('vendorId', '==', vendorProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(entries);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [vendorProfile.uid]);

  const filteredTransactions = transactions.filter(entry => {
    const matchesFilter = filter === 'all' || entry.status === filter;
    const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingSales = transactions
    .filter(e => e.status === 'pending' && e.type === 'sale')
    .reduce((acc, e) => acc + e.amount, 0);

  const pendingPayoutsAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);

  const clearedBalance = vendorProfile.balance;

  return (
    <div className="space-y-8">
      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-16 h-16" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400   mb-1">Total Earnings</p>
              <h3 className="text-2xl font-black text-gray-900 ">NPR {vendorProfile.totalEarnings.toLocaleString()}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-16 h-16" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400   mb-1">Current Balance</p>
              <h3 className="text-2xl font-black text-gray-900 ">NPR {clearedBalance.toLocaleString()}</h3>
            </div>
            <button 
              onClick={onRequestPayout}
              className="text-xs font-black text-red-600 flex items-center gap-1 group/btn"
            >
              Request Payout <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-16 h-16" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400   mb-1">Pending Payouts</p>
              <h3 className="text-2xl font-black text-gray-900 ">NPR {pendingPayoutsAmount.toLocaleString()}</h3>
            </div>
            <p className="text-[10px] text-gray-400 font-medium italic">Already requested</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <History className="w-16 h-16" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400   mb-1">Pending Sales</p>
              <h3 className="text-2xl font-black text-gray-900 ">NPR {pendingSales.toLocaleString()}</h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <AlertCircle className="w-3 h-3" /> Clears in 7 days
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hisab-Kitab (Transaction Ledger) Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 ">Financial Ledger</h2>
            <p className="text-xs text-gray-400 font-bold   mt-1">Transaction History (Bahi-Khata)</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm focus:ring-2 focus:ring-secondary transition-all w-full md:w-64"
              />
            </div>
            <div className="flex bg-gray-50 p-1 rounded-2xl">
              {(['all', 'pending', 'cleared'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black   transition-all ${
                    filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Description</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400  ">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400   text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6"><div className="h-8 bg-gray-50 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <ArrowRightLeft className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900">No Transactions Yet</h3>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        Start selling to see your earnings and payouts here. Your first sale will trigger the ledger.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((entry) => (
                  <tr key={entry.id} className="transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">{entry.description}</p>
                        {entry.orderId && (
                          <p className="text-[10px] text-secondary font-black  ">Order #{entry.orderId.slice(-8).toUpperCase()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black   ${
                        entry.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 
                        entry.type === 'payout' ? 'bg-red-50 text-red-600' : 
                        entry.type === 'adjustment' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {entry.type === 'sale' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {entry.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className={`text-sm font-black ${entry.type === 'sale' ? 'text-gray-900' : entry.type === 'adjustment' && entry.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {entry.type === 'sale' || (entry.type === 'adjustment' && entry.amount > 0) ? '+' : '-'} NPR {Math.abs(entry.amount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {entry.status === 'cleared' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : entry.status === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-secondary" />
                        )}
                        <span className={`text-[10px] font-black   ${
                          entry.status === 'cleared' ? 'text-emerald-600' : 
                          entry.status === 'failed' ? 'text-red-600' : 'text-secondary'
                        }`}>
                          {entry.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-gray-400 transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



