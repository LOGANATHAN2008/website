"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const projects = [
  {
    title: "DSU Study Buddy",
    url: "dsu.loganathan.site",
    color: "from-blue-500/20 to-purple-500/20",
    border: "border-blue-500/30"
  },
  {
    title: "Ling Platform",
    url: "ling.loganathan.site",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30"
  },
  {
    title: "Loga FM Radio",
    url: "fm.loganathan.site",
    color: "from-pink-500/20 to-orange-500/20",
    border: "border-pink-500/30"
  }
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-24 bg-dark-lighter/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-4"
          >
            Demo <span className="text-gradient">Projects</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Take a look at some of my recent work to see the quality and style I can bring to your project.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.a
              href={`https://${project.url}`}
              target="_blank"
              rel="noopener noreferrer"
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`block glass rounded-3xl overflow-hidden group border ${project.border} hover:shadow-2xl hover:shadow-${project.border.split('-')[1]}/20 transition-all duration-300`}
            >
              <div className={`h-48 bg-gradient-to-br ${project.color} flex items-center justify-center relative overflow-hidden`}>
                {/* macOS Window Mockup */}
                <div className="absolute inset-x-4 top-4 bottom-[-20px] bg-dark rounded-t-xl shadow-2xl border border-white/10 flex flex-col">
                  <div className="bg-dark-lighter px-3 py-2 flex items-center space-x-2 border-b border-white/5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center text-gray-500 text-sm">
                    {project.title} Preview
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex justify-between items-center bg-dark/50">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{project.title}</h3>
                  <p className="text-sm text-gray-400">{project.url}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-dark-lighter flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <ExternalLink size={18} />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <a href="#contact" className="inline-flex items-center space-x-2 text-primary hover:text-white transition-colors font-medium">
            <span>View More Projects</span>
            <ExternalLink size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
