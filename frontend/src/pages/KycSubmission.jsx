import React, { useState } from 'react';
import { ShieldCheck, UploadCloud, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';

// Aligned with backend endpoint structure
const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const KycSubmission = ({ token, onBack }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    idType: 'NIN',
    idNumber: '',
  });
  const [documentUrls, setDocumentUrls] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const idOptions = [
    { value: 'NIN', label: 'National Identification Number (NIN)' },
    { value: 'Drivers_License', label: "Driver's License" },
    { value: 'Voters_Card', label: "Voter's Card" },
    { value: 'Passport', label: 'International Passport' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (documentUrls.length + selectedFiles.length > 2) {
      setStatus({ type: 'error', message: 'You can upload a maximum of 2 verification documents.' });
      return;
    }

    setUploading(true);
    setStatus({ type: null, message: '' });

    // Processing one by one to ensure proper URL collection from backend
    try {
      const uploadedUrls = [];
      for (const file of selectedFiles) {
        const uploadData = new FormData();
        uploadData.append('file', file);

        const res = await fetch(`${BACKEND_BASE_URL}/api/upload/file`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload document.');
        uploadedUrls.push(data.url || data.imageUrl);
      }
      
      setDocumentUrls(prev => [...prev, ...uploadedUrls].slice(0, 2));
      setStatus({ type: 'success', message: 'Documents processed successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (indexToRemove) => {
    setDocumentUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (documentUrls.length === 0) {
      setStatus({ type: 'error', message: 'Please upload identity document.' });
      return;
    }

    setStatus({ type: null, message: '' });

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/submit-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          idType: formData.idType,
          idNumber: formData.idNumber,
          documentUrl: documentUrls.join(', ') 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');

      setStatus({ type: 'success', message: 'KYC packet submitted successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen flex items-center justify-center text-slate-200">
      <div className="bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="bg-slate-900 p-6 border-b border-slate-800 relative">
          {onBack && (
            <button onClick={onBack} className="absolute left-4 top-6 text-slate-400 hover:text-white transition">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-600/20 rounded-full mb-3">
              <ShieldCheck size={28} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Agent Verification</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
          {status.message && (
            <div className={`p-3.5 border rounded-xl flex gap-2.5 text-xs font-bold ${
              status.type === 'error' ? 'bg-rose-900/20 border-rose-800 text-rose-400' : 'bg-emerald-900/20 border-emerald-800 text-emerald-400'
            }`}>
              <AlertCircle size={16} />
              <p>{status.message}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-500">Full Legal Name</label>
            <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} className="w-full text-sm p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-500">ID Type</label>
              <select name="idType" value={formData.idType} onChange={handleInputChange} className="w-full text-sm p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500">
                {idOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-500">ID Number</label>
              <input type="text" name="idNumber" required value={formData.idNumber} onChange={handleInputChange} className="w-full text-sm p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-500">Upload Identity</label>
            {documentUrls.length < 2 && (
              <div className="relative border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-blue-500 transition">
                <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                <UploadCloud size={32} className="text-slate-600" />
                <p className="text-xs font-bold mt-2">{uploading ? 'Processing...' : 'Upload Identity Capture'}</p>
              </div>
            )}
            {documentUrls.map((url, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                <span>Document {index + 1} Attached</span>
                <button type="button" onClick={() => removeDocument(index)} className="text-rose-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <button type="submit" disabled={uploading || documentUrls.length === 0} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition disabled:opacity-50">
            Submit Verification Packet
          </button>
        </form>
      </div>
    </div>
  );
};

export default KycSubmission;