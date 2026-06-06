import React, { useState } from 'react';
import { ShieldCheck, UploadCloud, CheckCircle } from 'lucide-react';

const KycSubmission = ({ token, currentStatus }) => {
  const [status, setStatus] = useState(currentStatus || 'unsubmitted');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);

    try {
      // Step 1: Fire document stream binary payload directly into our R2 storage instance
      const formData = new FormData();
      formData.append('images', file); // mapped to backend storage expectations
      
      const r2Res = await fetch('/api/upload/listings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const r2Data = await r2Res.json();
      const documentUrl = r2Data.urls[0];

      // Step 2: Push pending registration verification data back into user space
      await fetch('/api/users/submit-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ kycDocumentUrl: documentUrl })
      });

      setStatus('pending');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (status === 'verified') {
    return (
      <div className="p-6 max-w-xl mx-auto text-center bg-white rounded-xl border border-slate-200 mt-10">
        <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-900">Account Fully Verified</h2>
        <p className="text-slate-500 text-sm mt-1">Your verification badge is active across the KIWI-list platform network.</p>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="p-6 max-w-xl mx-auto text-center bg-white rounded-xl border border-slate-200 mt-10">
        <ShieldCheck className="text-amber-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-900">Verification Under Review</h2>
        <p className="text-slate-500 text-sm mt-1">Admins are checking your credentials. Your status will update soon.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl border border-slate-200 mt-10">
      <h2 className="text-lg font-black text-slate-900 mb-1">Verify Your Broker Account</h2>
      <p className="text-xs text-slate-500 mb-6">Upload a valid ID card or business registration license to activate your verification status badge.</p>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition">
          <UploadCloud className="text-slate-400 mb-2" size={32} />
          <span className="text-sm font-bold text-slate-700">{file ? file.name : "Select ID Document"}</span>
          <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files[0])} />
        </label>
        
        <button type="submit" disabled={!file || uploading}
          className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl uppercase tracking-wider disabled:bg-slate-200 transition">
          {uploading ? 'Processing Documents...' : 'Submit Credentials'}
        </button>
      </form>
    </div>
  );
};

export default KycSubmission;
