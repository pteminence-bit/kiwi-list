import React, { useState } from 'react';
import { UserCheck, Upload, Loader2, CheckCircle } from 'lucide-react';

const KYCSubmissionForm = ({ token, isVerified }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    idType: 'NIN',
    idNumber: '',
    documentUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Early Return if user has already passed validation checks
  if (isVerified) {
    return (
      <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm max-w-md flex items-center gap-3">
        <CheckCircle className="text-emerald-600 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-emerald-900 text-sm">Identity Verified</h4>
          <p className="text-xs text-emerald-700 mt-0.5">Your profile is fully verified. Premium listing uploads and digital wallet withdrawals are completely active.</p>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('https://kiwi-list-api.onrender.com/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const result = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, documentUrl: result.url }));
        setStatusMsg({ type: 'success', text: 'ID Document uploaded successfully!' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } // FIXED: Corrected spelling to finally
    finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.documentUrl) {
      setStatusMsg({ type: 'error', text: 'Please upload a clear copy of your identity document first.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('https://kiwi-list-api.onrender.com/api/admin/submit-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'KYC submitted! Pending admin moderation review.' });
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-md">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
        <UserCheck className="text-blue-600" size={18} />
        <h3 className="font-bold text-slate-900 text-sm">Agent Verification (KYC)</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Legal Full Name</label>
          <input 
            type="text" 
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 text-slate-800"
            placeholder="Eminence Bassey"
            value={formData.fullName}
            onChange={e => setFormData({...formData, fullName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">ID Type</label>
            <select 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
              value={formData.idType}
              onChange={e => setFormData({...formData, idType: e.target.value})}
            >
              <option value="NIN">NIN</option>
              <option value="Passport">Passport</option>
              <option value="Drivers_License">Driver's License</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">ID Number</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 text-slate-800"
              placeholder="Document ID string"
              value={formData.idNumber}
              onChange={e => setFormData({...formData, idNumber: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Upload Verification Document</label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 rounded-lg p-4 cursor-pointer text-slate-500 transition-colors">
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-blue-600" />
            ) : (
              <>
                <Upload size={18} className="mb-1 text-slate-400" />
                <span className="font-medium text-center">Click to upload file copy</span>
              </>
            )}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>

        {statusMsg.text && (
          <div className={`p-2.5 rounded-lg border text-center font-medium ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {statusMsg.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={submitting || uploading}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition tracking-wide disabled:bg-slate-300"
        >
          {submitting ? 'Submitting Data...' : 'Submit Verification Docs'}
        </button>
      </form>
    </div>
  );
};

export default KYCSubmissionForm;