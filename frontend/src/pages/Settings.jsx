import React, { useState, useEffect } from 'react';
import { User, Save, CreditCard, UserCheck, Upload, Loader2 } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const Settings = ({ token }) => {
  // --- STATE FOR PROFILE & PAYOUTS ---
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    bankName: '',
    accountNumber: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // --- STATE FOR KYC VERIFICATION ---
  const [kycData, setKycData] = useState({
    fullName: '',
    idType: 'NIN',
    idNumber: '',
    documentUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycMessage, setKycMessage] = useState({ type: '', text: '' });

  // Load existing settings on mount
  useEffect(() => {
    fetch(`${BACKEND_BASE_URL}/api/users/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
        return res.json();
      })
      .then(data => {
        setFormData({
          displayName: data.displayName || '',
          phoneNumber: data.phoneNumber || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || ''
        });
      })
      .catch(err => console.error("Error fetching settings metrics:", err));
  }, [token]);

  // Handle standard Profile Metadata update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/users/settings`, {
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
      setMessage('Network connection loop error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Cloudflare R2 binary payload uploads
  const handleKycFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setKycMessage({ type: '', text: '' });
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
        throw new Error('Upload infrastructure returned invalid server string payload.');
      }

      const result = await res.json();
      if (res.ok) {
        setKycData(prev => ({ ...prev, documentUrl: result.url }));
        setKycMessage({ type: 'success', text: 'Identity document staged successfully!' });
      } else {
        throw new Error(result.error || 'Media pipeline file upload failed');
      }
    } catch (err) {
      setKycMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Handle administrative verification queue submissions
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycData.documentUrl) {
      setKycMessage({ type: 'error', text: 'Please attach a clear image copy of your selected document identification proof.' });
      return;
    }

    setSubmittingKyc(true);
    setKycMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/admin/submit-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(kycData)
      });

      const result = await res.json();
      if (res.ok) {
        setKycMessage({ type: 'success', text: 'KYC data securely routed to system governance administration review boards.' });
      } else {
        throw new Error(result.error || 'Handshake pipeline registration failure.');
      }
    } catch (err) {
      setKycMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingKyc(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen ml-0 md:ml-64 text-black transition-all duration-300">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* VIEW HEADER */}
        <div>
          <h1 className="text-2xl font-black text-black">Account Settings</h1>
          <p className="text-sm text-slate-600 font-medium">Manage your agent profile, verification status records, and settlement accounts.</p>
        </div>

        {/* PRIMARY METADATA PROFILE AND PAYOUT FORM CONTAINER */}
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg text-sm font-bold border ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-900 border-emerald-400' : 'bg-red-50 text-red-900 border-red-400'}`}>
              {message}
            </div>
          )}

          {/* Card A: Profile Information */}
          <div className="bg-white p-4 md:p-6 rounded-xl border-2 border-slate-300 shadow-sm">
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

          {/* Card B: Payout Settlement Configurations */}
          <div className="bg-white p-4 md:p-6 rounded-xl border-2 border-slate-300 shadow-sm">
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
                  className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-bold animate-none"
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
              <Save size={16} /> {saving ? 'Saving Profile...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Card C: AGENT IDENTITY VERIFICATION PIPELINE SECURED BLOCK */}
        <form onSubmit={handleKycSubmit} className="bg-white p-4 md:p-6 rounded-xl border-2 border-slate-300 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" /> Agent Verification (KYC)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              Verify your agent status to post properties and eliminate marketplace contact paywalls.
            </p>
          </div>

          {kycMessage.text && (
            <div className={`p-3 rounded-lg text-xs font-bold border ${kycMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-400' : 'bg-red-50 text-red-900 border-red-400'}`}>
              {kycMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-black text-black uppercase mb-2">Full Legal Name</label>
              <input 
                type="text"
                required
                value={kycData.fullName}
                onChange={e => setKycData({...kycData, fullName: e.target.value})}
                className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-semibold"
                placeholder="As shown on ID"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase mb-2">ID Document Type</label>
              <select
                value={kycData.idType}
                onChange={e => setKycData({...kycData, idType: e.target.value})}
                className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-bold"
              >
                <option value="NIN">National Identification Number (NIN)</option>
                <option value="International_Passport">International Passport</option>
                <option value="Drivers_License">Driver's License</option>
                <option value="Voters_Card">Voter's Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase mb-2">ID Document Number</label>
              <input 
                type="text"
                required
                value={kycData.idNumber}
                onChange={e => setKycData({...kycData, idNumber: e.target.value})}
                className="w-full px-3 py-2 bg-white border-2 border-slate-400 text-black rounded-lg focus:outline-none focus:border-blue-600 text-sm font-semibold"
                placeholder="Enter document ID text"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase mb-2">Upload Clear Document Proof</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-400 hover:border-blue-600 bg-slate-50 rounded-lg p-5 cursor-pointer text-slate-600 transition duration-150 relative min-h-[90px]">
              {uploading ? (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="text-xs font-bold text-slate-500">Streaming media via R2 pipeline...</span>
                </div>
              ) : kycData.documentUrl ? (
                <div className="text-center">
                  <span className="text-xs font-black text-emerald-600 block mb-1">✓ Media Staged Successfully</span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-xs">{kycData.documentUrl}</span>
                </div>
              ) : (
                <>
                  <Upload size={20} className="text-slate-500 mb-1" />
                  <span className="text-xs font-bold text-center">Click to browse asset file (PNG, JPG, PDF)</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                onChange={handleKycFileUpload} 
                disabled={uploading} 
              />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submittingKyc || uploading || !kycData.documentUrl}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow transition"
            >
              {submittingKyc ? 'Submitting to Governance...' : 'Submit Verification Docs'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Settings;