"use client";

import { motion } from "framer-motion";
import { Zap, MonitorSmartphone, Search, Clock, HeartHandshake, CreditCard } from "lucide-react";

const features = [
  { icon: CreditCard, title: "Affordable Price", desc: "Premium quality without breaking the bank." },
  { icon: MonitorSmartphone, title: "Mobile Friendly", desc: "Flawless experience across all devices." },
  { icon: Zap, title: "Fast Loading", desc: "Optimized for speed and performance." },
  { icon: Search, title: "SEO Friendly", desc: "Built with best practices to rank higher." },
  { icon: Clock, title: "Fast Delivery", desc: "Quick turnaround times for your projects." },
  { icon: HeartHandshake, title: "Free Support", desc: "Dedicated support after project completion." }
];

export default function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-primary/10 rounded-full blur-[120px] -z-10"></div>
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:w-1/3"
          >
            <h2 className="text-4xl font-bold mb-6">
              Why <span className="text-gradient">Choose Me?</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              I don't just build websites; I craft digital experiences that help your business grow. 
              Here is what you can expect when working with me.
            </p>
            <div className="glass p-6 rounded-2xl border-l-4 border-l-primary">
              <p className="italic text-gray-300">
                "Loganathan delivered an exceptional website that exceeded my expectations. Fast, modern, and affordable!"
              </p>
            </div>
          </motion.div>
          
          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 rounded-2xl flex items-start space-x-4 hover:bg-white/5 transition-colors"
              >
                <div className="p-3 bg-dark-lighter rounded-xl text-primary shrink-0">
                  <feature.icon size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{feature.title}</h4>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
