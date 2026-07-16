import React, { useState } from 'react';
import { auth } from '../firebase'; 
import { ImagePlus, X, Loader2, UploadCloud } from 'lucide-react';

const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

/**
 * ImageUploader
 * Handles multi-part file uploads to the KIWI-list storage engine.
 * Supports up to 4 images per property listing.
 */
const ImageUploader = ({ onImagesSelected, initialImages = [] }) => {
  const [previews, setPreviews] = useState(initialImages);
  const [uploadedUrls, setUploadedUrls] = useState(initialImages);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    
    if (newFiles.length + previews.length > 4) {
      alert("Maximum 4 images allowed per listing.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Session expired. Please log in again.");
      return;
    }

    setUploading(true);

    try {
      const token = await currentUser.getIdToken(true);

      // Optimistic UI update
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);

      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file); // Ensure this matches what your backend expects
        
        const res = await fetch(`${BACKEND_BASE_URL}/api/upload`, { // FIXED: Changed back to /api/upload
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Upload failed.');
        
        return result.url || result.imageUrl;
      });

      const processedUrls = await Promise.all(uploadPromises);
      const updatedUrls = [...uploadedUrls, ...processedUrls];
      
      setUploadedUrls(updatedUrls);
      onImagesSelected(updatedUrls);

    } catch (error) {
      console.error("Image pipeline failure:", error);
      alert(error.message || "An error occurred during upload.");
      // Rollback previews on failure
      setPreviews(uploadedUrls);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    // Clean up memory
    if (previews[indexToRemove].startsWith('blob:')) {
      URL.revokeObjectURL(previews[indexToRemove]);
    }
    
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
          <div key={`${src}-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
            <img src={src} alt="Property preview" className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={() => handleRemoveImage(idx)}
              className="absolute top-2 right-2 p-1 bg-white/90 backdrop-blur-sm rounded-full text-slate-900 shadow-lg hover:bg-red-500 hover:text-white transition-colors z-10"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {previews.length < 4 && (
          <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? (
              <Loader2 className="text-blue-600 animate-spin" size={24} />
            ) : (
              <UploadCloud className="text-slate-400 mb-2" size={24} />
            )}
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {uploading ? 'Uploading...' : 'Add Photo'}
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
      <p className="text-xs text-slate-400 font-medium">Add up to 4 high-resolution images. First image will be used as the listing cover.</p>
    </div>
  );
};

export default ImageUploader;