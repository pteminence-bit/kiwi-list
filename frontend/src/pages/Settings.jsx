import React, { useState, useEffect } from 'react';
import { User, Loader2, Save, Building2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Settings = ({ token, onProfileUpdate }) => {
  const [profile, setProfile] = useState({ displayName: '', phoneNumber: '', bio: '', bankName: '', accountNumber: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setProfile({ 
        displayName: data.displayName || '', 
        phoneNumber: data.phoneNumber || '', 
        bio: data.bio || '',
        bankName: data.bankName || '',
        accountNumber: data.accountNumber || ''
      }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`${API_BASE_URL}/api/users/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(profile)
    });
    if (res.ok) {
      setMsg({ type: 'success', text: 'Settings updated!' });
      if (onProfileUpdate) onProfileUpdate();
    } else {
      setMsg({ type: 'error', text: 'Update failed.' });
    }
    setSaving(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-950 text-white">
      <h1 className="text-2xl font-black mb-6">Account Settings</h1>
      {msg.text && <div className={`p-4 mb-4 rounded-lg ${msg.type === 'success' ? 'bg-emerald-900/20' : 'bg-rose-900/20'}`}>{msg.text}</div>}
      
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Identity Section */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h3 className="flex items-center gap-2 font-bold mb-4"><User size={18} className="text-blue-500" /> Basic Identity</h3>
          <div className="space-y-4">
            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg" value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})} placeholder="Display Name" />
            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} placeholder="WhatsApp Number" />
            <textarea className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Broker Bio" />
          </div>
        </div>

        {/* Payout Section */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h3 className="flex items-center gap-2 font-bold mb-4"><Building2 size={18} className="text-blue-500" /> Payout Bank Setup</h3>
          <div className="space-y-4">
            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg" placeholder="Bank Name" value={profile.bankName} onChange={e => setProfile({...profile, bankName: e.target.value})} />
            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg" placeholder="Account Number" value={profile.accountNumber} onChange={e => setProfile({...profile, accountNumber: e.target.value})} />
            <button type="submit" className="w-full py-3 bg-blue-600 rounded-lg font-bold">
              {saving ? <Loader2 className="animate-spin mx-auto" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;