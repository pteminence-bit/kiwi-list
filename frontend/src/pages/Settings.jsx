import React, { useState, useEffect } from 'react';
import { User, Save, CreditCard } from 'lucide-react';

const Settings = ({ token }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    bankName: '',
    accountNumber: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/users/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          displayName: data.displayName || '',
          phoneNumber: data.phoneNumber || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || ''
        });
      })
      .catch(err => console.error("Error fetching settings:", err));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setMessage('Changes saved successfully!');
      } else {
        setMessage('Failed to update credentials.');
      }
    } catch (err) {
      setMessage('Network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen ml-0 md:ml-64 text-black transition-all duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-black">Account Settings</h1>
          <p className="text-sm text-slate-600 font-medium">Manage your profile metadata and settlement bank accounts.</p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-bold border ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-900 border border-emerald-400' : 'bg-red-50 text-red-900 border border-red-400'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-300 shadow-sm">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-600" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black uppercase mb-2">Full Name / Company</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={e => setFormData({...formData, displayName: e.target.value})}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-semibold placeholder-slate-500"
                  placeholder="e.g. Jane Doe Properties"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-black uppercase mb-2">Contact Number</label>
                <input 
                  type="text" 
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-semibold placeholder-slate-500"
                  placeholder="e.g. +234..."
                />
              </div>
            </div>
          </div>

          {/* Payout Banking Card */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-300 shadow-sm">
            <h2 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
              <CreditCard size={18} className="text-amber-600" /> Flutterwave Payout Method
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">Specify the Nigerian bank account where accumulated premium contact unlock splits (70%) will be automatically paid out.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black uppercase mb-2">Bank Name</label>
                <select 
                  value={formData.bankName}
                  onChange={e => setFormData({...formData, bankName: e.target.value})}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-bold"
                >
                  <option value="" className="text-black">Select Bank</option>
                  <option value="Access Bank" className="text-black">Access Bank</option>
                  <option value="GTBank" className="text-black">Guaranty Trust Bank (GTB)</option>
                  <option value="Zenith Bank" className="text-black">Zenith Bank</option>
                  <option value="UBA" className="text-black">United Bank for Africa (UBA)</option>
                  <option value="Sterling Bank" className="text-black">Sterling Bank</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-black uppercase mb-2">Account Number (NUBAN)</label>
                <input 
                  type="text" 
                  maxLength={10}
                  value={formData.accountNumber}
                  onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-semibold placeholder-slate-500"
                  placeholder="10-digit NUBAN"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-black hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow transition"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;