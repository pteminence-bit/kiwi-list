import React, { useState, useEffect } from 'react';
import { User, Phone, FileText, UserCheck, Upload, Loader2, CheckCircle, Save } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const Settings = ({ token, isVerified, onProfileUpdate }) => {
  const [profile, setProfile] = useState({
    displayName: '',
    phoneNumber: '',
    bio: ''
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [kycData, setKycData] = useState({
    fullName: '',
    idType: 'NIN',
    idNumber: '',
    documentUrl: ''
  });
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
            bio: data.bio || ''
          });
        }
      } catch (err) {
        console.error("Failed to fetch user profile metadata details:", err);
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textError = await res.text();
        console.error("Server HTML response breakdown:", textError);
        throw new Error(`Server returned status ${res.status}. Route update initialization error.`);
      }

      const data = await res.json();

      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile changes applied cleanly!' });
        if (onProfileUpdate) onProfileUpdate();
      } else {
        throw new Error(data.error || 'Failed to update profile settings.');
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
      const res = await fetch(`${BACKEND_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Upload service returned non-JSON response.');
      }

      const result = await res.json();
      if (res.ok) {
        setKycData(prev => ({ ...prev, documentUrl: result.url }));
        setKycMsg({ type: 'success', text: 'ID Document uploaded successfully to R2 edges!' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      setKycMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycData.documentUrl) {
      setKycMsg({ type: 'error', text: 'Please upload a clear copy of your identity document first.' });
      return;
    }

    setSubmitting(true);
    setKycMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/admin/submit-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(kycData)
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('KYC service endpoint did not return JSON parameters.');
      }

      const result = await res.json();
      if (res.ok) {
        setKycMsg({ type: 'success', text: 'KYC routing complete! Your agent badges are pending evaluation.' });
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      setKycMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading) {
    return <div className="p-8 text-center text-slate-500 text-xs font-bold tracking-wide bg-slate-50 min-h-screen flex items-center justify-center">Syncing account parameter variables...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-800 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-xs text-slate-500 font-medium">Keep your broker credentials updated and manage security metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <User className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-900 text-sm">Basic Marketplace Identity</h3>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Display Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 font-medium text-slate-800"
                  placeholder="e.g. Eminence Properties"
                  value={profile.displayName}
                  onChange={e => setProfile({...profile, displayName: e.target.value})}
                />
                <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Contact Number (WhatsApp Linked)</label>
              <div className="relative">
                <input 
                  type="tel" 
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 font-medium text-slate-800"
                  placeholder="e.g. +234 80 0000 0000"
                  value={profile.phoneNumber}
                  onChange={e => setProfile({...profile, phoneNumber: e.target.value})}
                />
                <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Broker Bio / Agency Description</label>
              <div className="relative">
                <textarea 
                  rows={4}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 font-medium text-slate-800 resize-none"
                  placeholder="Tell clients about your listings, regions, and experience..."
                  value={profile.bio}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                />
                <FileText size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {profileMsg.text && (
              <div className={`p-2.5 rounded-lg border text-center font-bold ${profileMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {profileMsg.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={profileSaving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition tracking-wide flex items-center justify-center gap-2 disabled:bg-slate-300 shadow-sm text-xs"
            >
              {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {profileSaving ? 'Saving Parameters...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {isVerified ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
              <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-extrabold text-emerald-900 text-sm">Identity Verification Active</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed font-medium">
                  Your legal identity profile has been reviewed and authenticated by Kiwi-List safety algorithms. 
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  <UserCheck size={12} /> Verified Agent Account
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <UserCheck className="text-amber-500" size={18} />
                <h3 className="font-bold text-slate-900 text-sm">Agent Verification (KYC)</h3>
              </div>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-4">
                Upload your identification documentation below. Verification activates marketplace visibility and enables digital wallet balance withdrawal transfers.
              </p>

              <form onSubmit={handleKycSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Legal Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 font-medium text-slate-800"
                    placeholder="Eminence Bassey"
                    value={kycData.fullName}
                    onChange={e => setKycData({...kycData, fullName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">ID Type</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold text-slate-700"
                      value={kycData.idType}
                      onChange={e => setKycData({...kycData, idType: e.target.value})}
                    >
                      <option value="NIN">NIN (National ID)</option>
                      <option value="Passport">Passport</option>
                      <option value="Drivers_License">Driver's License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">ID Number</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 font-medium text-slate-800"
                      placeholder="Document entry string"
                      value={kycData.idNumber}
                      onChange={e => setKycData({...kycData, idNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Upload Verification Document</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 rounded-lg p-5 cursor-pointer text-slate-500 transition-colors">
                    {uploading ? (
                      <Loader2 size={22} className="animate-spin text-blue-600" />
                    ) : (
                      <>
                        <Upload size={20} className="mb-1 text-slate-400" />
                        <span className="font-bold text-slate-700 text-center">Click to select document</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Supports high-res Images or PDFs</span>
                      </>
                    )}
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  {kycData.documentUrl && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 text-right truncate">✓ Path Loaded: Cloudflare Storage Active</p>
                  )}
                </div>

                {kycMsg.text && (
                  <div className={`p-2.5 rounded-lg border text-center font-bold ${kycMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {kycMsg.text}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting || uploading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition tracking-wide disabled:bg-slate-300 text-xs"
                >
                  {submitting ? 'Submitting Verification Data...' : 'Submit Verification Docs'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;