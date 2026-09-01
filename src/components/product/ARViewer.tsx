import React, { useState } from 'react';
import { Box, Smartphone, Maximize, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ARViewerProps {
  modelUrl: string;
  posterUrl?: string;
  productName: string;
}

export const ARViewer: React.FC<ARViewerProps> = ({ modelUrl, posterUrl, productName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-6 py-4 bg-secondary text-white rounded-2xl font-black text-xs   hover:bg-secondary transition-all shadow-xl shadow-secondary/10 group"
      >
        <Box className="w-5 h-5 group-hover:scale-110 transition-transform" />
        View in 3D / AR
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 rounded-2xl">
                    <Smartphone className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{productName}</h2>
                    <p className="text-xs text-gray-500 font-bold  ">Augmented Reality Experience</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-4 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </header>

              <div className="flex-1 relative bg-gray-50">
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                    <Loader2 className="w-12 h-12 animate-spin text-secondary" />
                    <p className="text-sm font-bold text-gray-400  ">Loading 3D Model...</p>
                  </div>
                )}
                
                <model-viewer
                  src={modelUrl}
                  poster={posterUrl}
                  alt={`A 3D model of ${productName}`}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  onLoad={() => setIsLoading(false)}
                  style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                >
                  <button slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-secondary text-white rounded-full font-black text-sm   shadow-2xl flex items-center gap-3">
                    <Maximize className="w-5 h-5" />
                    Place in Room
                  </button>
                </model-viewer>
              </div>

              <footer className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black  ">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  WebXR Compatible
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black  ">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  High Fidelity
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black  ">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  Real-world Scale
                </div>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};



