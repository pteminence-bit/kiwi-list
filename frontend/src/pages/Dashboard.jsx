import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Building2, Package, Settings, ShieldCheck, MessageSquare, Loader2, UserCircle } from 'lucide-react';
import { auth } from '../firebase';
import { API_BASE_URL } from '../config';

const Dashboard = () => {
  const [stats, setStats] = useState({ balance: 0, listings: 0, inventory: 0 });
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
          setStats({ balance: data.balance || 0, listings: data.listingsCount || 0, inventory: data.inventoryCount || 0 });
        }
      } catch (err) { console.error("Stats fetch error:", err); }
      finally { setLoading(false); }
    };
    fetchDashboardStats();
  }, []);

  const navItems = [
    { name: 'Wallet', path: '/wallet', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', stat: `₦${stats.balance.toLocaleString()}` },
    { name: 'My Listings', path: '/manage', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', stat: `${stats.listings} Active` },
    { name: 'Inventory', path: '/inventory', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', stat: `${stats.inventory} Items` },
    { name: 'Messages', path: '/chats', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Verification', path: '/kyc', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Settings', path: '/settings', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-4 rounded-full text-slate-400">
            <UserCircle size={48} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Account Overview</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{auth.currentUser?.email}</p>
          </div>
        </div>
        <div className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-full tracking-widest shadow-lg">
          Member Status: Active
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.path} 
            className="group p-6 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm hover:shadow-lg flex flex-col gap-4"
          >
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
              {loading ? (
                <Loader2 className="animate-spin text-slate-300 mt-1" size={16} />
              ) : (
                <p className="text-lg font-black text-slate-900">{item.stat || 'Manage'}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;