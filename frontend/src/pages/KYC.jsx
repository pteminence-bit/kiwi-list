import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const KYC = ({ token, isVerified }) => {
  const [data, setData] = useState({ fullName: '', idType: 'NIN', idNumber: '', url: '' });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE_URL}/api/upload/file`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    const result = await res.json();
    setData(prev => ({ ...prev, url: result.url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`${API_BASE_URL}/api/users/submit-kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ fullName: data.fullName, idType: data.idType, idNumber: data.idNumber, documentUrl: data.url })
    });
    if (res.ok) setMsg({ type: 'success', text: 'Submitted for review!' });
    setSubmitting(false);
  };

  if (isVerified) return <div className="p-6 bg-emerald-900/20 text-emerald-400 rounded-xl flex items-center gap-3"><CheckCircle /> Verified</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-slate-900 rounded-2xl text-white">
      <h2 className="text-xl font-black mb-4">KYC Verification</h2>
      {msg.text && <div className="mb-4 text-sm font-bold">{msg.text}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 bg-slate-950 rounded-lg" placeholder="Full Name" onChange={e => setData({...data, fullName: e.target.value})} />
        <input className="w-full p-3 bg-slate-950 rounded-lg" placeholder="ID Number" onChange={e => setData({...data, idNumber: e.target.value})} />
        <label className="block p-4 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer text-center">
          <Upload className="mx-auto" />
          {uploading ? 'Uploading...' : 'Upload ID'}
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
        <button className="w-full py-3 bg-blue-600 rounded-lg font-bold">{submitting ? 'Submitting...' : 'Submit'}</button>
      </form>
    </div>
  );
};

export default KYC;

