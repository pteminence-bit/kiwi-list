import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Building2, Package, Settings, ShieldCheck, MessageSquare, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { API_BASE_URL } from '../config';

const Dashboard = () => {
  const [stats, setStats] = useState({
    balance: '...',
    listingsCount: 0,
    inventoryCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/users/me/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            balance: `₦${data.balance?.toLocaleString() || 0}`,
            listingsCount: data.listingsCount || 0,
            inventoryCount: data.inventoryCount || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statItems = [
    { label: 'Wallet Balance', value: stats.balance, icon: Wallet },
    { label: 'Active Listings', value: stats.listingsCount, icon: Building2 },
    { label: 'Inventory Items', value: stats.inventoryCount, icon: Package },
  ];

  const menuItems = [
    { name: 'My Listings', path: '/manage', icon: Building2, color: 'text-blue-500' },
    { name: 'Inventory', path: '/inventory', icon: Package, color: 'text-indigo-500' },
    { name: 'Wallet', path: '/wallet', icon: Wallet, color: 'text-emerald-500' },
    { name: 'Messages', path: '/chats', icon: MessageSquare, color: 'text-amber-500' },
    { name: 'Verification', path: '/kyc', icon: ShieldCheck, color: 'text-purple-500' },
    { name: 'Settings', path: '/settings', icon: Settings, color: 'text-slate-500' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-slate-900 mb-8">Account Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statItems.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <stat.icon size={24} />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.path} 
            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 transition-all shadow-sm hover:shadow-md flex flex-col items-center text-center gap-3"
          >
            <item.icon className={item.color} size={32} />
            <span className="font-bold text-slate-800 text-sm">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;