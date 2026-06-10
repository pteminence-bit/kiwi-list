import React, { useState, useEffect } from 'react';
import { User, Phone, FileText, UserCheck, Upload, Loader2, CheckCircle, Save } from 'lucide-react';

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
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        if (onProfileUpdate) onProfileUpdate();
      } else throw new Error('Update failed');
    } catch (err) { setProfileMsg({ type: 'error', text: err.message }); } finally { setProfileSaving(false); }
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
      if (res.ok) setKycMsg({ type: 'success', text: 'KYC submitted successfully!' });
      else throw new Error('Submission failed');
    } catch (err) { setKycMsg({ type: 'error', text: err.message }); } finally { setSubmitting(false); }
  };

  if (profileLoading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500">Manage your broker identity and verification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-6 border-b pb-4"><User size={18} className="text-blue-600" /> Basic Identity</h3>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <input className="w-full p-3 border rounded-lg" value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})} placeholder="Display Name" />
            <input className="w-full p-3 border rounded-lg" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} placeholder="WhatsApp Number" />
            <textarea className="w-full p-3 border rounded-lg h-24" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Broker Bio" />
            <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center gap-2">
              {profileSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save Profile
            </button>
          </form>
        </div>

        {/* KYC Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {isVerified ? (
            <div className="bg-emerald-50 p-6 rounded-xl flex items-start gap-4">
              <CheckCircle className="text-emerald-600 shrink-0" size={32} />
              <div>
                <h4 className="font-bold text-emerald-900">Verification Active</h4>
                <p className="text-xs text-emerald-700 mt-1">Your account is fully authenticated.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <h3 className="font-bold text-slate-900 mb-2">Agent Verification</h3>
              <input className="w-full p-3 border rounded-lg" required placeholder="Legal Full Name" value={kycData.fullName} onChange={e => setKycData({...kycData, fullName: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <select className="p-3 border rounded-lg" value={kycData.idType} onChange={e => setKycData({...kycData, idType: e.target.value})}>
                  <option value="NIN">NIN</option><option value="Passport">Passport</option>
                </select>
                <input className="p-3 border rounded-lg" required placeholder="ID Number" value={kycData.idNumber} onChange={e => setKycData({...kycData, idNumber: e.target.value})} />
              </div>
              <label className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500">
                <Upload size={24} className="text-slate-400" />
                <span className="text-xs font-bold mt-2">{uploading ? 'Uploading...' : 'Upload ID'}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <button disabled={submitting} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg">Submit Verification</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;