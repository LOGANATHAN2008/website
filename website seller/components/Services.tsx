"use client";

import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Building2, 
  Briefcase, 
  Utensils, 
  Coffee, 
  UserCircle, 
  Landmark, 
  ShoppingCart, 
  Layers 
} from "lucide-react";

const services = [
  { icon: GraduationCap, title: "School Website", desc: "Modern portals for educational institutions." },
  { icon: Building2, title: "College Website", desc: "Comprehensive platforms for universities." },
  { icon: Briefcase, title: "Business Website", desc: "Corporate sites to establish your brand." },
  { icon: Utensils, title: "Hotel Website", desc: "Elegant booking and showcase sites." },
  { icon: Coffee, title: "Restaurant Website", desc: "Appetizing menus and reservations." },
  { icon: UserCircle, title: "Portfolio Website", desc: "Showcase your work and skills." },
  { icon: Landmark, title: "Political Website", desc: "Connect with voters and supporters." },
  { icon: ShoppingCart, title: "E-Commerce Website", desc: "Robust online stores to sell products." },
  { icon: Layers, title: "Custom Web App", desc: "Tailored web applications for complex needs." },
];

export default function Services() {
  return (
    <section id="services" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-4"
          >
            My <span className="text-gradient">Services</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            I offer a wide range of web development services to help you establish a strong online presence. 
            Each project is built with precision and care.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300 group"
            >
              <div className="w-14 h-14 bg-dark-lighter rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <service.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
              <p className="text-gray-400">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
