"use client";

import Link from "next/link";
import { Instagram, Linkedin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="glass-card mt-20 border-t border-white/10 pt-16 pb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div className="mb-6 md:mb-0 text-center md:text-left flex flex-col items-center md:items-start">
            <img src="/logo.png" alt="Loganathan M Logo" className="h-10 w-auto object-contain mb-3" style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.4))" }} />
            <p className="text-gray-400">Freelance Web Developer & Website Seller</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="https://www.instagram.com/kutty_loga_" target="_blank" rel="noopener noreferrer" className="p-3 bg-dark-lighter rounded-full hover:bg-primary hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://www.linkedin.com/in/loganathan-site" target="_blank" rel="noopener noreferrer" className="p-3 bg-dark-lighter rounded-full hover:bg-secondary hover:text-white transition-colors">
              <Linkedin size={20} />
            </a>
            <a href="https://loganathan.site" target="_blank" rel="noopener noreferrer" className="p-3 bg-dark-lighter rounded-full hover:bg-accent hover:text-white transition-colors">
              <Globe size={20} />
            </a>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>
            Created by <a href="https://loganathan.site" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Loganathan M</a>
          </p>
          <p className="mt-2 md:mt-0 italic text-gray-400">
            "Designed & Developed with Passion by Loganathan M"
          </p>
        </div>
      </div>
    </footer>
  );
}
