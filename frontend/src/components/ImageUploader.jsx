import React, { useState } from 'react';
import { auth } from '../firebase'; 
import { ImagePlus, X, Loader2 } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const ImageUploader = ({ onImagesSelected }) => {
  const [previews, setPreviews] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    
    if (newFiles.length + previews.length > 4) {
      alert("Maximum 4 images allowed.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("No authenticated user session found. Please log in again.");
      return;
    }

    setUploading(true);

    try {
      const token = await currentUser.getIdToken(true);

      if (!token) {
        throw new Error("No token provided. Please log in again.");
      }

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);

      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`${BACKEND_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to upload image.');
        
        return result.url || result.imageUrl;
      });

      const processedUrls = await Promise.all(uploadPromises);
      const updatedUrls = [...uploadedUrls, ...processedUrls];
      
      setUploadedUrls(updatedUrls);
      onImagesSelected(updatedUrls);

    } catch (error) {
      console.error("Image uploading failed:", error);
      alert(error.message || "An error occurred during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    URL.revokeObjectURL(previews[indexToRemove]);
    
    const updatedPreviews = previews.filter((_, idx) => idx !== indexToRemove);
    const updatedUrls = uploadedUrls.filter((_, idx) => idx !== indexToRemove);
    
    setPreviews(updatedPreviews);
    setUploadedUrls(updatedUrls);
    onImagesSelected(updatedUrls);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previews.map((src, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
            <img src={src} alt="Preview" className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={() => handleRemoveImage(idx)}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition z-10"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {previews.length < 4 && (
          <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-800/10 transition bg-slate-900/40 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? (
              <Loader2 className="text-blue-500 animate-spin" />
            ) : (
              <ImagePlus className="text-slate-400" />
            )}
            <span className="text-xs text-slate-400 font-semibold mt-2">
              {uploading ? 'Processing...' : 'Add Image'}
            </span>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
              disabled={uploading}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-slate-500 font-medium">Upload 2 to 4 high-resolution photos of the property.</p>
    </div>
  );
};

export default ImageUploader;