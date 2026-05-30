"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -z-10 animate-float"></div>
      
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center space-x-2 bg-dark-lighter/80 border border-white/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="text-primary w-4 h-4" />
            <span className="text-sm font-medium text-gray-300">Premium Website Development</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Transform Your <br />
            <span className="text-gradient">Digital Vision</span> <br />
            Into Reality
          </h1>
          
          <p className="text-lg text-gray-400 mb-8 max-w-lg">
            Hi, I'm Loganathan M. I build stunning, high-performance, and custom websites tailored to elevate your brand. 
            Experience macOS inspired modern design at affordable prices.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a href="#contact" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]">
              <span>Order Website</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#pricing" className="glass hover:bg-white/5 text-white px-8 py-4 rounded-xl font-semibold transition-all">
              View Pricing
            </a>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="glass-card p-2 rounded-2xl border border-white/20 relative z-10 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
            {/* Mockup macOS Window */}
            <div className="bg-dark/80 backdrop-blur-md rounded-t-xl px-4 py-3 flex items-center border-b border-white/10">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="mx-auto text-xs text-gray-400 font-medium">loganathan.site</div>
            </div>
            {/* Image Placeholder - since we don't have an image, we use a nice gradient/abstract */}
            <div className="aspect-[4/3] bg-gradient-to-br from-dark-lighter to-dark rounded-b-xl overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
              <div className="text-center z-10 p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent p-1 mx-auto mb-4 shadow-lg shadow-primary/20">
                  <div className="w-full h-full bg-dark rounded-full flex items-center justify-center text-3xl font-bold text-white">L</div>
                </div>
                <h3 className="text-2xl font-bold text-white">Loganathan M</h3>
                <p className="text-primary mt-1">Full Stack Developer</p>
              </div>
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 glass p-4 rounded-xl flex items-center space-x-3 shadow-xl border-white/20 z-20"
          >
            <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><CheckCircle size={24} /></div>
            <div>
              <p className="text-sm font-bold text-white">100% Quality</p>
              <p className="text-xs text-gray-400">Guaranteed</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
