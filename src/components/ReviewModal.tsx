import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Review, Order } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  orderId: string;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  vendorId, 
  vendorName, 
  orderId,
  onSuccess 
}) => {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSubmitting(true);
    try {
      const reviewData: Omit<Review, 'id'> = {
        orderId,
        vendorId,
        buyerId: user.uid,
        buyerName: profile.displayName || 'Anonymous',
        buyerPhoto: profile.photoURL,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Update vendor rating and review count
      const vendorRef = doc(db, 'vendors', vendorId);
      const vendorSnap = await getDoc(vendorRef);
      
      if (vendorSnap.exists()) {
        const vendorData = vendorSnap.data();
        const currentRating = vendorData.rating || 0;
        const currentCount = vendorData.reviewsCount || 0;
        
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;

        await updateDoc(vendorRef, {
          rating: Number(newRating.toFixed(1)),
          reviewsCount: newCount
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl p-8"
          >
            {success ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Thank You!</h2>
                <p className="text-gray-500">Your review for {vendorName} has been submitted.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <header className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Rate Your Experience</h2>
                    <p className="text-sm text-gray-500 mt-1">How was your order from {vendorName}?</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-10 h-10 ${
                            star <= (hoverRating || rating) 
                              ? 'fill-secondary text-secondary' 
                              : 'text-gray-200'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Your Feedback</label>
                    <textarea 
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us about the product quality, delivery, and service..."
                      className="w-full h-32 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary transition-all resize-none text-sm"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-secondary transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};



