"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter Package",
    price: "$99",
    desc: "Perfect for small businesses or personal portfolios.",
    features: ["1-3 Pages", "Mobile Responsive", "Basic SEO", "Contact Form", "3 Days Delivery", "1 Month Free Support"],
    popular: false
  },
  {
    name: "Professional Package",
    price: "$249",
    desc: "Ideal for growing businesses needing more features.",
    features: ["Up to 10 Pages", "Premium Design", "Advanced SEO", "CMS Integration", "7 Days Delivery", "3 Months Free Support"],
    popular: true
  },
  {
    name: "Premium Package",
    price: "$499+",
    desc: "Custom web applications and e-commerce solutions.",
    features: ["Unlimited Pages", "Custom Functionality", "Database Integration", "User Authentication", "Priority Delivery", "1 Year Free Support"],
    popular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-dark-lighter/30 relative">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-4"
          >
            Affordable <span className="text-gradient">Pricing</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Transparent pricing with no hidden fees. Choose the package that best fits your needs.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`glass rounded-3xl p-8 relative ${plan.popular ? 'border-primary/50 shadow-[0_0_30px_rgba(99,102,241,0.2)] md:-translate-y-4' : 'border-white/10'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm h-10">{plan.desc}</p>
              </div>
              
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center text-gray-300">
                    <Check size={18} className="text-primary mr-3 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <a 
                href="#contact" 
                className={`block w-full py-4 rounded-xl font-bold text-center transition-all ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30' 
                    : 'bg-dark-lighter hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                Choose Plan
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
