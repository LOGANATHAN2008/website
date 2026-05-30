"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code, Monitor, Smartphone, Zap, CheckCircle, Star } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "glass py-4" : "py-6 bg-transparent"}`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3">
          <img src="/logo.png" alt="Loganathan M Logo" className="h-10 w-auto object-contain" style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.4))" }} />
          <span className="text-2xl font-bold text-gradient">LOGANATHAN M</span>
        </Link>
        <div className="hidden md:flex space-x-8">
          <Link href="#services" className="hover:text-primary transition-colors">Services</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>
        <Link href="#contact" className="hidden md:inline-flex bg-primary hover:bg-secondary text-white px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-primary/30">
          Order Now
        </Link>
      </div>
    </motion.nav>
  );
}
