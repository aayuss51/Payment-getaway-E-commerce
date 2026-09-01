import React from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ArrowRight, ShoppingCart, Scale, X, Check, Minus } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const Compare = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (compareList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Scale className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 ">Comparison list is empty</h1>
        <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
          Add products from the same category to compare their features and prices.
        </p>
        <Link 
          to="/store" 
          className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-secondary/10"
        >
          Go to Store <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  // Get all unique feature keys from all products (if they had specific features, but for now we use common ones)
  const commonFeatures = [
    { label: 'Price', key: 'price', format: (val: number) => `Rs. ${val.toLocaleString()}` },
    { label: 'Category', key: 'category' },
    { label: 'Stock', key: 'stock', format: (val: number) => val > 0 ? `${val} available` : 'Out of stock' },
    { label: 'Vendor', key: 'vendorName' },
    { label: 'Description', key: 'description' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <BackButton />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-gray-900 ">Product Comparison</h1>
          <p className="text-gray-500 font-medium mt-2">
            Comparing {compareList.length} products in <span className="text-secondary font-bold">{compareList[0].category}</span>
          </p>
        </div>
        <button 
          onClick={clearCompare}
          className="text-sm font-bold text-red-500 flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" /> Clear Comparison
        </button>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="min-w-[800px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-1/5 p-6 text-left bg-gray-50 rounded-tl-[2.5rem] border-b border-gray-100">
                  <span className="text-xs font-black text-gray-400  ">Features</span>
                </th>
                {compareList.map((product, idx) => (
                  <th 
                    key={product.id} 
                    className={`p-6 bg-white border-b border-gray-100 relative group ${idx === compareList.length - 1 ? 'rounded-tr-[2.5rem]' : ''}`}
                  >
                    <button 
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 rounded-xl transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden mb-4 bg-gray-50">
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                      <button 
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commonFeatures.map((feature, idx) => (
                <tr key={feature.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-6 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-900">{feature.label}</span>
                  </td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-6 border-b border-gray-100 text-center">
                      <span className="text-sm text-gray-600">
                        {feature.format 
                          ? feature.format((product as any)[feature.key]) 
                          : (product as any)[feature.key] || <Minus className="w-4 h-4 mx-auto text-gray-300" />
                        }
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {compareList.length >= 2 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 bg-red-50 rounded-[2.5rem] border border-red-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-secondary text-white rounded-2xl shadow-lg shadow-secondary/20">
              <Scale className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Comparison Outcome</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Savings Analysis */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100/50">
              <h3 className="text-sm font-black text-secondary   mb-4">Potential Savings</h3>
              {(() => {
                const prices = compareList.map(p => p.price);
                const maxPrice = Math.max(...prices);
                const minPrice = Math.min(...prices);
                const savings = maxPrice - minPrice;
                const cheapestProduct = compareList.find(p => p.price === minPrice);

                return (
                  <div className="space-y-2">
                    <p className="text-3xl font-black text-gray-900">Rs. {savings.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      By choosing <span className="font-bold text-gray-900">{cheapestProduct?.name}</span> instead of the most expensive option, you save <span className="text-green-600 font-bold">Rs. {savings.toLocaleString()}</span>.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Quality & Rating Analysis */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100/50">
              <h3 className="text-sm font-black text-secondary   mb-4">Quality & Trust</h3>
              {(() => {
                const productsWithRatings = compareList.map(p => ({ ...p, rating: p.rating || 4.0 })); // Default 4.0 if missing
                const bestRated = productsWithRatings.reduce((prev, current) => (prev.rating > current.rating) ? prev : current);

                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-black text-gray-900">{bestRated.rating.toFixed(1)}</p>
                      <div className="flex text-secondary">
                        {[...Array(5)].map((_, i) => (
                          <Check key={i} className={`w-4 h-4 ${i < Math.floor(bestRated.rating) ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      <span className="font-bold text-gray-900">{bestRated.name}</span> has the highest overall quality score based on customer feedback and vendor reputation.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Final Verdict */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100/50">
              <h3 className="text-sm font-black text-secondary   mb-4">Final Verdict</h3>
              {(() => {
                const prices = compareList.map(p => p.price);
                const minPrice = Math.min(...prices);
                const cheapest = compareList.find(p => p.price === minPrice);
                
                // Simple logic: if price is significantly lower, it's the "Best Value"
                // If it's the highest rated, it's "Premium Choice"
                return (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      <Check className="w-3 h-3" /> Recommended Choice
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Based on price and features, <span className="font-bold text-gray-900">{cheapest?.name}</span> offers the best value for your money in the <span className="font-bold">{compareList[0].category}</span> category.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-red-200/50">
            <h3 className="text-sm font-black text-gray-900   mb-4">Key Detail Differences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compareList.slice(0, 2).map((product, i) => (
                <div key={product.id} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-white flex-shrink-0 flex items-center justify-center font-black text-secondary border border-red-100">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};



