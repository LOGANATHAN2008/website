"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc, serverTimestamp, onSnapshot, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, ShoppingCart, Users, MessageSquare, BarChart3, 
  Bell, Settings, UserCircle, LogOut, CheckCircle, XCircle, 
  TrendingUp, CircleDollarSign, Clock, Calendar, ChevronRight, 
  Search, Eye, Trash2, Send, Link as LinkIcon, Smartphone,
  Activity, Star, Edit3
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, LineChart, Line 
} from "recharts";

// --- DUMMY DATA FOR CHARTS ---
const revenueData = [
  { name: 'Jan', total: 1200 }, { name: 'Feb', total: 2100 }, { name: 'Mar', total: 1800 },
  { name: 'Apr', total: 3200 }, { name: 'May', total: 4500 }, { name: 'Jun', total: 4200 },
];
const clientGrowthData = [
  { name: 'Jan', clients: 4 }, { name: 'Feb', clients: 8 }, { name: 'Mar', clients: 15 },
  { name: 'Apr', clients: 22 }, { name: 'May', clients: 35 }, { name: 'Jun', clients: 48 },
];

export default function PremiumAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, pending: 0, completed: 0, revenue: 45200, activeClients: 0, totalReviews: 0 });
  
  // UI States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [replyForm, setReplyForm] = useState({ subject: "", content: "", price: "" });

  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);

  // --- MAINTENANCE MODE HANDLERS ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "settings", "config"), (snap) => {
      if (snap.exists()) {
        setMaintenanceMode(!!snap.data().maintenanceMode);
      }
    });
    return () => unsub();
  }, []);

  const handleMaintenanceToggle = async (checked: boolean) => {
    setSavingMaintenance(true);
    try {
      // Save to new settings/config doc
      await setDoc(doc(db, "settings", "config"), {
        maintenanceMode: checked,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Legacy support
      await setDoc(doc(db, "services", "maintenance"), {
        enabled: checked,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setMaintenanceMode(checked);
    } catch (err) {
      console.error("Failed to save maintenance mode settings:", err);
    } finally {
      setSavingMaintenance(false);
    }
  };

  // --- INIT & AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/admin");
      else { setUser(currentUser); fetchData(); }
    });
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [router]);

  // --- MOUSE TRACKING FOR GLOW ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if(!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Orders
      const oSnap = await getDocs(collection(db, "orders"));
      const oData: any[] = [];
      let pCount = 0; let cCount = 0;
      const uniqueClients = new Map();
      
      oSnap.forEach((doc) => {
        const d = doc.data();
        oData.push({ id: doc.id, ...d });
        if (d.status === "pending") pCount++;
        if (d.status === "completed") cCount++;
        if (d.email) uniqueClients.set(d.email, { name: d.name, phone: d.phone, email: d.email });
      });
      oData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(oData);
      
      // Mock Clients from unique emails
      const cData = Array.from(uniqueClients.values()).map((c: any, i) => ({
        ...c, ordersCount: Math.floor(Math.random() * 3) + 1, totalSpent: Math.floor(Math.random() * 1000) + 100
      }));
      setClients(cData);

      // Fetch Reviews
      const rSnap = await getDocs(collection(db, "reviews"));
      const rData: any[] = [];
      rSnap.forEach((doc) => rData.push({ id: doc.id, ...doc.data() }));
      setReviews(rData);

      setStats({
        totalOrders: oData.length,
        pending: pCount,
        completed: cCount,
        revenue: 45200 + (cCount * 250), // Mock revenue calculation
        activeClients: cData.length,
        totalReviews: rData.length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleLogout = () => signOut(auth);
  
  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await addDoc(collection(db, "replies"), { orderId: selectedOrder.id, ...replyForm, createdAt: serverTimestamp() });
      await updateDoc(doc(db, "orders", selectedOrder.id), { status: "processing" });
      setSelectedOrder(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const markCompleted = async (id: string) => {
    try { await updateDoc(doc(db, "orders", id), { status: "completed" }); setSelectedOrder(null); fetchData(); } 
    catch (err) { console.error(err); }
  };

  const deleteOrder = async (id: string) => {
    if(confirm("Delete this order?")) {
      try { await deleteDoc(doc(db, "orders", id)); fetchData(); } catch (err) { console.error(err); }
    }
  };

  // --- REUSABLE COMPONENTS ---
  const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[rgba(255,255,255,0.03)] backdrop-blur-[25px] border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden ${className}`}>
      {children}
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, color, growth }: any) => (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <GlassCard className="p-6 relative group overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
          </div>
          <div className={`w-12 h-12 rounded-[16px] bg-${color}-500/20 text-${color}-400 flex items-center justify-center`}>
            <Icon size={24} />
          </div>
        </div>
        <div className="flex items-center text-xs relative z-10">
          <TrendingUp size={14} className="text-emerald-400 mr-1" />
          <span className="text-emerald-400 font-medium">+{growth}%</span>
          <span className="text-gray-500 ml-2">from last month</span>
        </div>
      </GlassCard>
    </motion.div>
  );

  // --- RENDER CONTENT ---
  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

    switch (activeTab) {
      case "dashboard":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                  👋 Welcome Back, Loganathan M
                </h1>
                <p className="text-gray-400">Manage website orders, clients, reviews, pricing and business growth.</p>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <GlassCard className="px-4 py-2 flex items-center space-x-3">
                  <div className="flex flex-col text-right">
                    <span className="text-white font-bold">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center relative">
                    <Clock size={18} className="text-primary" />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0F172A]"></div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="blue" growth="12.5" />
              <StatCard title="Pending Orders" value={stats.pending} icon={Clock} color="orange" growth="5.2" />
              <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={CircleDollarSign} color="emerald" growth="24.8" />
              <StatCard title="Completed Orders" value={stats.completed} icon={CheckCircle} color="purple" growth="18.2" />
              <StatCard title="Active Clients" value={stats.activeClients} icon={Users} color="pink" growth="8.4" />
              <StatCard title="Total Reviews" value={stats.totalReviews} icon={Star} color="yellow" growth="15.3" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-6">Revenue Growth</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#6B7280" tick={{fill: '#6B7280'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#6B7280" tick={{fill: '#6B7280'}} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip contentStyle={{backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} />
                      <Area type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-6">Client Acquisition</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#6B7280" tick={{fill: '#6B7280'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#6B7280" tick={{fill: '#6B7280'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="clients" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        );
      
      case "orders":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">Recent Orders</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search orders..." className="bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary w-64 transition-all" />
              </div>
            </div>
            
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      <th className="p-4 rounded-tl-[24px]">Order ID</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 rounded-tr-[24px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500">No orders found.</td></tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4 text-sm font-mono text-gray-400">#{o.id.substring(0,6)}</td>
                          <td className="p-4">
                            <div className="font-bold text-white">{o.name}</div>
                            <div className="text-xs text-gray-500">{o.email}</div>
                          </td>
                          <td className="p-4 text-sm text-gray-300">{o.subject}</td>
                          <td className="p-4 text-sm text-gray-400">{o.createdAt ? new Date(o.createdAt.toMillis()).toLocaleDateString() : 'Just now'}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              o.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              o.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setSelectedOrder(o)} className="p-2 bg-white/5 hover:bg-primary/20 text-gray-300 hover:text-primary rounded-lg transition-colors"><Eye size={16}/></button>
                              <button onClick={() => deleteOrder(o.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        );

      case "clients":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
            <h2 className="text-3xl font-bold text-white mb-8">Client Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((c, i) => (
                <GlassCard key={i} className="p-6 flex flex-col items-center text-center group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent p-1 mb-4 shadow-lg">
                    <img src={`https://ui-avatars.com/api/?name=${c.name}&background=0D1117&color=fff`} alt={c.name} className="w-full h-full rounded-full border-2 border-[#0F172A]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{c.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{c.email}</p>
                  
                  <div className="w-full flex justify-between border-t border-b border-white/5 py-3 mb-4">
                    <div><p className="text-xs text-gray-500 uppercase">Orders</p><p className="font-bold text-white">{c.ordersCount}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase">Spent</p><p className="font-bold text-emerald-400">${c.totalSpent}</p></div>
                  </div>
                  
                  <div className="flex w-full space-x-2">
                    <button className="flex-1 bg-white/5 hover:bg-primary/20 text-white py-2 rounded-xl text-sm font-medium transition-colors">Message</button>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-sm font-medium transition-colors">Profile</button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        );
        
      case "reviews":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
            <h2 className="text-3xl font-bold text-white mb-8">Review Moderation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map(r => (
                <GlassCard key={r.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center font-bold text-primary">{r.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-white">{r.name}</h4>
                        <div className="flex text-yellow-400 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${r.approved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                      {r.approved ? 'Live' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-6 bg-white/5 p-4 rounded-xl border border-white/5">"{r.message}"</p>
                  <div className="flex space-x-3">
                    <button onClick={async () => { await updateDoc(doc(db, "reviews", r.id), { approved: !r.approved }); fetchData(); }} className="flex-1 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-colors">
                      {r.approved ? 'Hide Review' : 'Approve Review'}
                    </button>
                    <button onClick={async () => { await deleteDoc(doc(db, "reviews", r.id)); fetchData(); }} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-sm transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        );

      case "profile":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 max-w-4xl mx-auto">
            <GlassCard className="p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/40 to-accent/40 blur-xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center mt-12">
                <div className="w-32 h-32 rounded-[32px] bg-dark border-4 border-white/10 p-1 mb-6 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover rounded-[24px]" alt="Profile" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-1">Loganathan M</h2>
                <p className="text-primary font-medium mb-8">Founder & Web Developer</p>
                
                <div className="flex space-x-6 mb-8 w-full justify-center">
                  <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                    <h3 className="text-2xl font-bold text-white">{stats.totalOrders}</h3><p className="text-xs text-gray-400 uppercase">Orders</p>
                  </div>
                  <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                    <h3 className="text-2xl font-bold text-white">${(stats.revenue/1000).toFixed(1)}k</h3><p className="text-xs text-gray-400 uppercase">Revenue</p>
                  </div>
                  <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                    <h3 className="text-2xl font-bold text-white">{stats.totalReviews}</h3><p className="text-xs text-gray-400 uppercase">Reviews</p>
                  </div>
                </div>
                
                <button className="bg-primary hover:bg-primary/80 text-white px-8 py-3 rounded-full font-bold flex items-center space-x-2 transition-colors">
                  <Edit3 size={18}/> <span>Edit Profile</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        );

      case "settings":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>
            
            <GlassCard className="p-8">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Business Details</h3>
              <div className="space-y-4">
                <div><label className="text-sm text-gray-400 mb-1 block">Business Name</label><input type="text" value="Loganathan Web Services" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary" readOnly/></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Contact Email</label><input type="text" value="admin@loganathan.site" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary" readOnly/></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Website Link</label><input type="text" value="https://loganathan.site" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary" readOnly/></div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-8">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Theme Options</h3>
              <div className="flex space-x-4">
                <button className="flex-1 py-4 bg-white/10 border-2 border-primary rounded-xl text-white font-bold flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-dark mb-2"></div>Dark Mode</button>
                <button className="flex-1 py-4 bg-white/5 border-2 border-transparent rounded-xl text-gray-400 font-bold flex flex-col items-center opacity-50 cursor-not-allowed"><div className="w-8 h-8 rounded-full bg-white mb-2"></div>Light Mode</button>
              </div>
            </GlassCard>
          </motion.div>
        );

      case "maintenance-mode":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">Maintenance Mode Settings</h2>
            
            <GlassCard className="p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Global Site Control
              </h3>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-2 gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Under Maintenance Mode</h4>
                  <p className="text-gray-400 text-sm mt-1">Enable to put the entire main website under maintenance immediately.</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-base font-bold transition-all duration-300 ${maintenanceMode ? "text-emerald-400" : "text-red-400"}`}>
                    {maintenanceMode ? "ON" : "OFF"}
                  </span>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={maintenanceMode}
                      disabled={savingMaintenance}
                      onChange={(e) => handleMaintenanceToggle(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                <Eye size={20} className="text-secondary" />
                System Route Rules
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">Database Synchronized</span>
                  <span className="text-emerald-400 font-bold">Connected (Real-time)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">Allowed Paths (Dashboard Access)</span>
                  <span className="text-blue-400 font-medium font-mono">/admin, /admin/login, /admin/dashboard</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Blocked Paths (Public Visitor Redirect)</span>
                  <span className="text-red-400 font-medium font-mono">All Client-Facing Routes (/, /services, etc.)</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );

      default:
        return <div className="text-white text-center py-20">Coming Soon</div>;
    }
  };

  return (
    <div 
      className="flex h-screen bg-[#0F172A] overflow-hidden text-white font-sans selection:bg-primary selection:text-white"
      ref={mainRef}
      onMouseMove={handleMouseMove}
    >
      {/* Background Interactive Glow */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none z-0"
        animate={{ x: mousePosition.x - 300, y: mousePosition.y - 300 }}
        transition={{ type: "tween", ease: "circOut", duration: 0.5 }}
      />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Floating Premium Sidebar */}
      <aside className="w-72 h-full p-6 z-20 flex flex-col relative">
        <GlassCard className="w-full h-full p-4 flex flex-col">
          <div className="flex items-center space-x-3 mb-10 mt-2 px-2">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <span className="font-bold text-xl text-white">L</span>
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">AdminOS</h2>
              <p className="text-xs text-gray-400">Pro Edition</p>
            </div>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-4">Menu</p>
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'orders', icon: ShoppingCart, label: 'Orders', badge: stats.pending },
              { id: 'clients', icon: Users, label: 'Clients' },
              { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
              { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-[16px] transition-all duration-300 group ${activeTab === item.id ? 'bg-primary/20 text-white shadow-inner border border-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} className={activeTab === item.id ? "text-primary" : "text-gray-500 group-hover:text-gray-300"} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge ? <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span> : null}
              </button>
            ))}

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-8">System</p>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-[16px] transition-all duration-300 group ${activeTab === 'settings' ? 'bg-primary/20 text-white border border-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Settings size={20} className={activeTab === 'settings' ? "text-primary" : "text-gray-500"} />
              <span className="font-medium">Settings</span>
            </button>

            <button 
              onClick={() => setActiveTab('maintenance-mode')}
              className={`w-full flex items-center space-x-3 pl-8 pr-3 py-2 rounded-[16px] transition-all duration-300 group ${activeTab === 'maintenance-mode' ? 'bg-primary/20 text-white border border-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Activity size={16} className={activeTab === 'maintenance-mode' ? "text-primary" : "text-gray-500"} />
              <span className="font-medium text-sm">Maintenance Mode</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-[16px] transition-all duration-300 group ${activeTab === 'profile' ? 'bg-primary/20 text-white border border-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <UserCircle size={20} className={activeTab === 'profile' ? "text-primary" : "text-gray-500"} />
              <span className="font-medium">Profile</span>
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-[16px] transition-all">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </GlassCard>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden pr-6 py-6">
        
        {/* Topbar */}
        <header className="flex justify-end items-center mb-6 h-14">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell size={20} className="text-gray-300" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-accent rounded-full border-2 border-[#0F172A]"></span>
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-[rgba(30,41,59,0.95)] backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl p-4 z-50"
                  >
                    <h3 className="font-bold text-white mb-3 px-2">Notifications</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-3 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0"><ShoppingCart size={14}/></div>
                        <div><p className="text-sm font-medium text-white">New Order Received</p><p className="text-xs text-gray-400">2 mins ago</p></div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-3 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0"><Star size={14}/></div>
                        <div><p className="text-sm font-medium text-white">5-Star Review from Sarah</p><p className="text-xs text-gray-400">1 hour ago</p></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="h-12 flex items-center bg-white/5 border border-white/10 rounded-full pr-2 pl-4 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-sm font-medium text-white mr-3">Loganathan</span>
              <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=100&auto=format&fit=crop" className="w-8 h-8 rounded-full border border-white/20" alt="Avatar"/>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pr-4 rounded-[24px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Minimal Footer */}
        <div className="text-center py-4 text-xs text-gray-500 mt-auto">
          Designed & Developed by <a href="https://loganathan.site" target="_blank" className="text-primary hover:underline">Loganathan M</a> 🚀
        </div>
      </div>

      {/* APPLE INSPIRED ORDER MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[rgba(30,41,59,0.9)] backdrop-blur-2xl border border-white/10 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white">Order Details</h3>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><XCircle size={18}/></button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Client Name</p><p className="font-bold text-white text-lg">{selectedOrder.name}</p></div>
                  <div className="bg-white/5 p-4 rounded-2xl"><p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Contact</p><p className="font-bold text-white">{selectedOrder.email}</p><p className="text-sm text-gray-400">{selectedOrder.phone}</p></div>
                </div>
                
                <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/5">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Subject</p>
                  <p className="font-bold text-primary text-xl mb-4">{selectedOrder.subject}</p>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Project Requirements</p>
                  <p className="text-gray-300 leading-relaxed">"{selectedOrder.content}"</p>
                </div>

                {selectedOrder.status === 'pending' && (
                  <div className="border-t border-white/10 pt-8 mt-4">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center"><Send size={18} className="mr-2 text-primary"/> Send Quotation Reply</h4>
                    <form onSubmit={submitReply} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" required value={replyForm.subject} onChange={e=>setReplyForm({...replyForm, subject: e.target.value})} placeholder={`Re: ${selectedOrder.subject}`} className="bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"/>
                        <input type="text" required value={replyForm.price} onChange={e=>setReplyForm({...replyForm, price: e.target.value})} placeholder="Price (e.g. $249)" className="bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"/>
                      </div>
                      <textarea required rows={4} value={replyForm.content} onChange={e=>setReplyForm({...replyForm, content: e.target.value})} placeholder="Detail the services, timeline, and terms..." className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none resize-none"></textarea>
                      
                      <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => markCompleted(selectedOrder.id)} className="px-6 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl font-bold transition-colors">Mark Completed</button>
                        <button type="submit" className="px-8 py-3 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 rounded-xl font-bold transition-all">Send Reply</button>
                      </div>
                    </form>
                  </div>
                )}
                {selectedOrder.status !== 'pending' && selectedOrder.status !== 'completed' && (
                   <div className="flex justify-end pt-4"><button onClick={() => markCompleted(selectedOrder.id)} className="px-6 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl font-bold transition-colors">Mark as Completed</button></div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
