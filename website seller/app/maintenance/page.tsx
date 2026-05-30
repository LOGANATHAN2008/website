"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, Sparkles, Server } from "lucide-react";

export default function MaintenancePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  // Real-time Firestore sync: redirect back to home once maintenance is off
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "settings", "config"), (snap) => {
      if (snap.exists() && !snap.data().maintenanceMode) {
        router.push("/");
      }
    });
    return () => unsub();
  }, [router]);

  // Legacy listener support just in case
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "services", "maintenance"), (snap) => {
      if (snap.exists() && !snap.data().enabled) {
        router.push("/");
      }
    });
    return () => unsub();
  }, [router]);

  // Premium progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) {
          clearInterval(timer);
          return 94; // Holds at 94% until fully deployed
        }
        return prev + 1;
      });
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[650px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[32px] p-8 md:p-12 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Subtle glass shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-transparent to-white/[0.02] pointer-events-none"></div>

        {/* 3D-like floating layout container */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo / Badge */}
          <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] px-4 py-2 rounded-full mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-white/80 text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
              <Server size={12} className="text-indigo-400" />
              SYSTEM UPGRADE
            </span>
          </div>

          {/* Premium Icon Circle */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-b from-indigo-500/10 to-indigo-500/5 border border-white/[0.08] rounded-full flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-indigo-400" />
            </div>
          </div>

          {/* Titles */}
          <h1 className="text-white text-3xl md:text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
            Temporarily Offline
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-[450px] leading-relaxed mb-10">
            We are performing essential system updates to deliver a faster, more robust, and premium user experience. We will be back shortly.
          </p>

          {/* Progress Bar Glass Container */}
          <div className="w-full max-w-[400px] bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-8">
            <div className="flex justify-between items-center mb-2.5 text-xs text-gray-400 font-semibold px-1">
              <span className="flex items-center gap-1">
                <Activity size={12} className="text-indigo-400 animate-pulse" />
                Optimizing Core Engine...
              </span>
              <span>{progress}%</span>
            </div>
            
            {/* The Actual Progress Bar */}
            <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden p-[1px] border border-white/[0.05]">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Decorative Floating Status Badges */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-[400px] text-left">
            <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Features</p>
                <p className="text-xs text-white/80 font-semibold">Adding AI Tools</p>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400">
                <Server size={16} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Database</p>
                <p className="text-xs text-white/80 font-semibold">Real-time Synced</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-600 font-medium mt-10 tracking-wide uppercase">
            LOGANATHAN M SERVICES • EST. 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}
