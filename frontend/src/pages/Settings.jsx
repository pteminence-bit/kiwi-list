import React, { useState, useEffect } from 'react';
import { User, Phone, FileText, UserCheck, Upload, Loader2, CheckCircle, Save, Building2 } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const Settings = ({ token, isVerified, onProfileUpdate }) => {
  const [profile, setProfile] = useState({ displayName: '', phoneNumber: '', bio: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [kycData, setKycData] = useState({ fullName: '', idType: 'NIN', idNumber: '', kycDocumentUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kycMsg, setKycMsg] = useState({ type: '', text: '' });

  // NEW: Bank Setup State
  const [bankData, setBankData] = useState({ accountName: '', accountNumber: '', bankName: '' });
  const [bankSaving, setBankSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfile({ displayName: data.displayName || '', phoneNumber: data.phoneNumber || '', bio: data.bio || '' });
        }
      } catch (err) { console.error(err); } finally { setProfileLoading(false); }
    };
    fetchProfileData();
  }, [token]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated!' });
        if (onProfileUpdate) onProfileUpdate();
      } else throw new Error('Update failed');
    } catch (err) { setProfileMsg({ type: 'error', text: err.message }); } finally { setProfileSaving(false); }
  };

  // NEW: Bank Save Handler
  const handleBankSave = async (e) => {
    e.preventDefault();
    setBankSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/bank-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bankData)
      });
      if (res.ok) alert('Bank details saved successfully!');
      else throw new Error('Failed to save bank details');
    } catch (err) { alert(err.message); } finally { setBankSaving(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/upload/file`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: data });
      const result = await res.json();
      if (res.ok) {
        setKycData(prev => ({ ...prev, kycDocumentUrl: result.url || result.imageUrl }));
        setKycMsg({ type: 'success', text: 'Document uploaded successfully.' });
      }
    } catch (err) { setKycMsg({ type: 'error', text: 'Upload failed' }); } finally { setUploading(false); }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/submit-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...kycData, documentUrl: kycData.kycDocumentUrl })
      });
      if (res.ok) setKycMsg({ type: 'success', text: 'KYC submitted pending review!' });
      else throw new Error('Submission failed');
    } catch (err) { setKycMsg({ type: 'error', text: err.message }); } finally { setSubmitting(false); }
  };

  if (profileLoading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="w-full h-full p-4 md:p-8 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Account Settings</h1>
          <p className="text-sm text-slate-400">Manage your identity, bank details, and KYC verification.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Identity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-6 border-b border-slate-800 pb-4"><User size={18} className="text-blue-500" /> Basic Identity</h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})} placeholder="Display Name" />
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} placeholder="WhatsApp Number" />
              <textarea className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white h-24" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Broker Bio" />
              <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center gap-2">
                {profileSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save
              </button>
            </form>
          </div>

          {/* Bank Setup */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-6 border-b border-slate-800 pb-4"><Building2 size={18} className="text-blue-500" /> Payout Bank Setup</h3>
            <form onSubmit={handleBankSave} className="space-y-4">
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" required placeholder="Account Name" value={bankData.accountName} onChange={e => setBankData({...bankData, accountName: e.target.value})} />
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" required placeholder="Account Number" value={bankData.accountNumber} onChange={e => setBankData({...bankData, accountNumber: e.target.value})} />
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" required placeholder="Bank Name" value={bankData.bankName} onChange={e => setBankData({...bankData, bankName: e.target.value})} />
              <button className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg flex items-center justify-center gap-2">
                {bankSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save Bank Details
              </button>
            </form>
          </div>

          {/* KYC */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {isVerified ? (
              <div className="bg-emerald-900/20 border border-emerald-900 p-6 rounded-xl flex items-start gap-4">
                <CheckCircle className="text-emerald-500 shrink-0" size={32} />
                <div>
                  <h4 className="font-bold text-emerald-100">Verified</h4>
                  <p className="text-xs text-emerald-400 mt-1">Your account is fully verified.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="space-y-4">
                <h3 className="font-bold text-white mb-2">KYC Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" required placeholder="Legal Full Name" value={kycData.fullName} onChange={e => setKycData({...kycData, fullName: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <select className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" value={kycData.idType} onChange={e => setKycData({...kycData, idType: e.target.value})}>
                            <option value="NIN">NIN</option><option value="Passport">Passport</option>
                        </select>
                        <input className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" required placeholder="ID Number" value={kycData.idNumber} onChange={e => setKycData({...kycData, idNumber: e.target.value})} />
                    </div>
                </div>
                <label className="flex flex-col items-center p-6 border-2 border-dashed border-slate-800 rounded-lg cursor-pointer hover:border-blue-500">
                  <Upload size={24} className="text-slate-500" />
                  <span className="text-xs font-bold mt-2 text-slate-400">{uploading ? 'Uploading...' : 'Upload ID Document'}</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <button disabled={submitting} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">Submit Verification</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;