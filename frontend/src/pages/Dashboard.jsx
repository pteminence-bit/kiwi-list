import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Building2, Package, Settings, ShieldCheck, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { auth } from '../firebase';
import { API_BASE_URL } from '../config';

const Dashboard = () => {
  const [data, setData] = useState({
    balance: 0,
    listingsCount: 0,
    inventoryCount: 0,
    fullName: 'User',
    email: '',
    isVerified: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/users/me/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const resData = await response.json();
          setData(resData);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const navItems = [
    { name: 'My Listings', path: '/manage', icon: Building2, value: data.listingsCount, color: 'text-blue-500' },
    { name: 'Inventory', path: '/inventory', icon: Package, value: data.inventoryCount, color: 'text-indigo-500' },
    { name: 'My Wallet', path: '/wallet', icon: Wallet, value: `₦${data.balance?.toLocaleString() || 0}`, color: 'text-emerald-500' },
    { name: 'Messages', path: '/chats', icon: MessageSquare, value: 'View Inbox', color: 'text-amber-500' },
    { name: 'Verification', path: '/kyc', icon: ShieldCheck, value: data.isVerified ? 'Verified' : 'Get Verified', color: 'text-purple-500' },
    { name: 'Settings', path: '/settings', icon: Settings, value: 'Manage', color: 'text-slate-500' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Account Overview */}
      <div className="mb-10 p-8 bg-slate-900 rounded-3xl text-white shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            {data.fullName}
            {data.isVerified && <CheckCircle2 className="text-blue-400" size={24} />}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{data.email}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Account Status</p>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${data.isVerified ? 'bg-blue-600' : 'bg-slate-700'}`}>
            {data.isVerified ? 'Verified Member' : 'Pending Verification'}
          </span>
        </div>
      </div>

      {/* Navigation & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.path} 
            className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 transition-all shadow-sm hover:shadow-md flex items-center gap-4"
          >
            <div className={`p-4 rounded-xl bg-slate-50 ${item.color}`}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <item.icon size={24} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.name}</p>
              <p className="font-bold text-slate-900 text-lg">{item.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;