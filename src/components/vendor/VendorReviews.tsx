import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Review } from '../../types';
import { Star, User, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface VendorReviewsProps {
  vendorId: string;
}

export const VendorReviews: React.FC<VendorReviewsProps> = ({ vendorId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const fetchedReviews = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-gray-900">No reviews yet</h3>
        <p className="text-sm text-gray-500">Be the first to share your experience with this store!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {review.buyerPhoto ? (
                    <img src={review.buyerPhoto} className="w-full h-full object-cover" alt={review.buyerName} />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{review.buyerName}</h4>
                  <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-3 h-3 ${star <= review.rating ? 'fill-secondary text-secondary' : 'text-gray-200'}`} 
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed italic">
              "{review.comment}"
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};



