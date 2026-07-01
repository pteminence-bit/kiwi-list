import React, { useState, useEffect } from 'react';
import { User, FileText, UserCheck, Upload, Loader2, CheckCircle, Save, Building2 } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const Settings = ({ token, isVerified, onProfileUpdate }) => {
  const [profile, setProfile] = useState({ 
    displayName: '', 
    phoneNumber: '', 
    bio: '', 
    bankName: '', 
    accountNumber: ''
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [kycData, setKycData] = useState({ fullName: '', idType: 'NIN', idNumber: '', kycDocumentUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kycMsg, setKycMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!token) return;
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/users/me`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({ 
            displayName: data.displayName || '', 
            phoneNumber: data.phoneNumber || '', 
            bio: data.bio || '',
            bankName: data.bankName || '',
            accountNumber: data.accountNumber || ''
          });
        }
      } catch (err) { 
        console.error("Fetch profile error:", err); 
      } finally { 
        setProfileLoading(false); 
      }
    };
    fetchProfileData();
  }, [token]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Settings updated successfully!' });
        if (onProfileUpdate) onProfileUpdate();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (err) { 
      setProfileMsg({ type: 'error', text: err.message }); 
    } finally { 
      setProfileSaving(false); 
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setKycMsg({ type: '', text: '' });
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/upload/file`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: data 
      });
      const result = await res.json();
      if (res.ok) {
        setKycData(prev => ({ ...prev, kycDocumentUrl: result.url || result.imageUrl }));
        setKycMsg({ type: 'success', text: 'Document uploaded successfully.' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) { 
      setKycMsg({ type: 'error', text: err.message || 'Upload failed' }); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycData.kycDocumentUrl) {
      setKycMsg({ type: 'error', text: 'Please upload an identity document first.' });
      return;
    }
    setSubmitting(true);
    setKycMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/submit-kyc`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          fullName: kycData.fullName,
          idType: kycData.idType,
          idNumber: kycData.idNumber,
          documentUrl: kycData.kycDocumentUrl 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setKycMsg({ type: 'success', text: 'KYC submitted pending review!' });
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) { 
      setKycMsg({ type: 'error', text: err.message }); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (profileLoading) return <div className="flex h-screen items-center justify-center text-slate-400 bg-slate-950">Loading...</div>;

  return (
    <div className="w-full h-full p-4 md:p-8 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Account Settings</h1>
          <p className="text-sm text-slate-400">Manage your identity, bank details, and KYC verification.</p>
        </div>

        {profileMsg.text && (
          <div className={`mb-4 p-4 rounded-lg text-sm font-bold ${profileMsg.type === 'success' ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400' : 'bg-rose-900/20 border border-rose-800 text-rose-400'}`}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-6 border-b border-slate-800 pb-4">
              <User size={18} className="text-blue-500" /> Basic Identity
            </h3>
            <div className="space-y-4">
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500" value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})} placeholder="Display Name" required />
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} placeholder="WhatsApp Number" />
              <textarea className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white h-24 outline-none focus:border-blue-500" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Broker Bio" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-white mb-6 border-b border-slate-800 pb-4">
              <Building2 size={18} className="text-blue-500" /> Payout Bank Setup
            </h3>
            <div className="space-y-4">
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500" placeholder="Bank Name" value={profile.bankName} onChange={e => setProfile({...profile, bankName: e.target.value})} required />
              <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500" placeholder="Account Number" value={profile.accountNumber} onChange={e => setProfile({...profile, accountNumber: e.target.value})} required />
              <button type="submit" disabled={profileSaving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50">
                {profileSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All Changes
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {kycMsg.text && (
              <div className={`mb-4 p-4 rounded-lg text-sm font-bold ${kycMsg.type === 'success' ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400' : 'bg-rose-900/20 border border-rose-800 text-rose-400'}`}>
                {kycMsg.text}
              </div>
            )}

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
                  <input className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500" required placeholder="Legal Full Name" value={kycData.fullName} onChange={e => setKycData({...kycData, fullName: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3">
                    <select className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500" value={kycData.idType} onChange={e => setKycData({...kycData, idType: e.target.value})}>
                      <option value="NIN">NIN</option>
                      <option value="Passport">Passport</option>
                    </select>
                    <input className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-blue-500" required placeholder="ID Number" value={kycData.idNumber} onChange={e => setKycData({...kycData, idNumber: e.target.value})} />
                  </div>
                </div>
                <label className="flex flex-col items-center p-6 border-2 border-dashed border-slate-800 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <Upload size={24} className="text-slate-500" />
                  <span className="text-xs font-bold mt-2 text-slate-400">
                    {uploading ? 'Uploading...' : kycData.kycDocumentUrl ? 'Document Ready (Click to Change)' : 'Upload ID Document'}
                  </span>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                </label>
                <button type="submit" disabled={submitting || uploading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50">
                  {submitting && <Loader2 className="animate-spin" size={16} />} Submit Verification
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;