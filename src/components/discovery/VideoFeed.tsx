import React, { useState, useRef, useEffect } from 'react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { Play, Pause, ShoppingBag, Heart, MessageCircle, Share2, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const VideoFeed: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        // Fetch products that have a videoUrl
        const productsRef = collection(db, 'products');
        const q = query(productsRef, limit(10)); // Simplified for demo
        const snapshot = await getDocs(q);
        
        const videoProducts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.videoUrl);
        
        setProducts(videoProducts);
      } catch (error) {
        console.error("Error fetching video feed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      setCurrentIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-secondary">
        <Loader2 className="w-12 h-12 animate-spin text-secondary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-secondary">
        <p className="text-white font-bold  ">No videos available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {products.map((product, index) => (
          <VideoItem 
            key={product.id} 
            product={product} 
            isActive={index === currentIndex} 
            isMuted={isMuted}
            toggleMute={() => setIsMuted(!isMuted)}
          />
        ))}
      </div>

      {/* Navigation Overlay */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-8 z-50">
        <button className="text-white font-black   text-sm opacity-50">Following</button>
        <button className="text-white font-black   text-sm border-b-4 border-secondary pb-2">Bazaar Inspire</button>
      </div>

      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-12 right-6 z-50 p-4 bg-black/20 backdrop-blur-md rounded-2xl text-white transition-all"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>
    </div>
  );
};

const VideoItem: React.FC<{ product: Product; isActive: boolean; isMuted: boolean; toggleMute: () => void }> = ({ product, isActive, isMuted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(err => console.warn("Autoplay blocked:", err));
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-screen w-full snap-start relative bg-black">
      <video 
        ref={videoRef}
        src={product.videoUrl}
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        className="h-full w-full object-cover"
      />

      {/* Interaction Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center z-20">
        <div className="flex flex-col items-center gap-1">
          <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto">
            <Heart className="w-7 h-7" />
          </button>
          <span className="text-white text-[10px] font-black  ">2.4k</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto">
            <MessageCircle className="w-7 h-7" />
          </button>
          <span className="text-white text-[10px] font-black  ">128</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white transition-all pointer-events-auto">
            <Share2 className="w-7 h-7" />
          </button>
          <span className="text-white text-[10px] font-black  ">Share</span>
        </div>
      </div>

      <div className="absolute left-6 bottom-12 right-24 z-20 space-y-4 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-secondary rounded-full border-2 border-white flex items-center justify-center text-white font-black text-lg">
            {product.vendorName?.[0] || 'B'}
          </div>
          <div className="space-y-0.5">
            <h4 className="text-white font-black text-lg  flex items-center gap-2">
              @{product.vendorName || 'BazaarVendor'}
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <Check className="w-2 h-2 text-white" />
              </div>
            </h4>
            <p className="text-white/80 text-xs font-medium">Original Sound - Bazaar Inspire</p>
          </div>
        </div>
        
        <p className="text-white text-sm font-medium leading-relaxed line-clamp-2">
          {product.description} #BazaarNepal #Handmade #Artisan
        </p>

        <button className="pointer-events-auto flex items-center gap-3 px-6 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs   transition-all shadow-2xl shadow-white/10">
          <ShoppingBag className="w-5 h-5" />
          Shop Now: NPR {product.price.toLocaleString()}
        </button>
      </div>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="w-20 h-20 text-white/40 fill-white/20" />
        </div>
      )}
    </div>
  );
};

const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
  </svg>
);



