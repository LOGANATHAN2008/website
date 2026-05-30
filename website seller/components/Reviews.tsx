"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { Star, MessageSquare } from "lucide-react";

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", rating: 5, message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, "reviews"), 
        where("approved", "==", true),
        // orderby creation isn't indexed by default with where in firebase sometimes unless you make composite index, 
        // we will fetch approved and sort client side if needed or just rely on simple fetch
      );
      const querySnapshot = await getDocs(q);
      const revData: any[] = [];
      querySnapshot.forEach((doc) => {
        revData.push({ id: doc.id, ...doc.data() });
      });
      // Sort client side
      revData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setReviews(revData);
    } catch (error) {
      console.error("Error fetching reviews", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "reviews"), {
        ...formData,
        approved: false, // Needs admin approval
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowForm(false);
        setSubmitted(false);
        setFormData({ name: "", rating: 5, message: "" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting review", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-dark-lighter/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Client <span className="text-gradient">Reviews</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 max-w-xl"
            >
              See what my previous clients have to say about my work.
            </motion.p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="mt-6 md:mt-0 px-6 py-3 bg-dark/50 border border-white/10 hover:border-primary/50 text-white rounded-xl transition-colors flex items-center space-x-2"
          >
            <MessageSquare size={18} />
            <span>Write a Review</span>
          </button>
        </div>

        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="glass-card p-6 md:p-8 rounded-2xl mb-12 max-w-2xl"
          >
            {submitted ? (
              <div className="text-center py-8 text-green-400">
                <p>Thank you! Your review has been submitted and is awaiting approval.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        type="button" 
                        key={star}
                        onClick={() => setFormData({...formData, rating: star})}
                        className="focus:outline-none"
                      >
                        <Star 
                          size={24} 
                          className={star <= formData.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Review Message</label>
                  <textarea 
                    required 
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.length > 0 ? reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass p-6 rounded-2xl flex flex-col h-full"
            >
              <div className="flex space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={16} 
                    className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} 
                  />
                ))}
              </div>
              <p className="text-gray-300 flex-1 mb-6">"{review.message}"</p>
              <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-auto">
                <span className="font-bold text-white">{review.name}</span>
                <span className="text-xs text-gray-500">
                  {review.createdAt ? new Date(review.createdAt.toMillis()).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-12 text-gray-500 glass rounded-2xl">
              No reviews yet. Be the first to leave one!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
