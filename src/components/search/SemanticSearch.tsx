import React, { useState } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Loader2, Sparkles, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateEmbedding, cosineSimilarity } from '../../services/aiService';
import { Product } from '../../types';

export const SemanticSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      // 1. Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(searchTerm);
      
      if (queryEmbedding.length === 0) {
        throw new Error("Could not understand search intent. Please try again.");
      }

      // 2. Fetch products (In a real app, use Firestore vector search)
      // For this demo, we'll fetch all active products and sort by similarity
      const productsRef = collection(db, 'products');
      const q = query(productsRef, limit(50)); // Limit for performance
      const snapshot = await getDocs(q);
      
      const products: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      // 3. Calculate similarity and sort
      const scoredProducts = products
        .filter(p => p.embedding && p.embedding.length > 0)
        .map(p => ({
          ...p,
          similarity: cosineSimilarity(queryEmbedding, p.embedding!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .filter(p => p.similarity > 0.6); // Threshold for relevance

      setResults(scoredProducts);
      
      if (scoredProducts.length === 0) {
        setError("No products found matching your intent.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred during search.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-red-100 rounded-[2rem] blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity" />
        <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-[2rem] p-2 shadow-2xl shadow-gray-200/50 focus-within:border-secondary transition-all">
          <div className="pl-6 pr-4">
            <Sparkles className="w-6 h-6 text-secondary animate-pulse" />
          </div>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for 'traditional wedding attire' or 'trekking gear'..."
            className="flex-1 py-4 bg-transparent border-none focus:ring-0 text-lg font-bold text-gray-900 placeholder:text-gray-400"
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-secondary text-white p-4 rounded-3xl hover:bg-secondary transition-all shadow-xl shadow-secondary/10 flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
            <span className="hidden sm:inline font-black   text-xs px-2">AI Search</span>
          </button>
        </div>
      </form>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {results.map((product) => (
              <div key={product.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden mb-4 relative">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-secondary   border border-red-100">
                    AI Match
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 font-medium mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-gray-900">NPR {product.price.toLocaleString()}</span>
                  <button className="p-3 bg-gray-50 text-gray-900 rounded-2xl hover:bg-secondary hover:text-white transition-all">
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-12 bg-red-50 rounded-[3rem] border border-red-100"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);



