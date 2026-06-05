import React, { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

const ImageUploader = ({ onImagesSelected }) => {
  const [previews, setPreviews] = useState([]);
  const [rawFiles, setRawFiles] = useState([]); // Track cumulative raw files locally

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    if (newFiles.length + previews.length > 4) {
      alert("Maximum 4 images allowed.");
      return;
    }

    // 1. Generate local object URLs for rendering visuals
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);

    // 2. Accumulate raw binary file structures safely
    const updatedFiles = [...rawFiles, ...newFiles];
    setRawFiles(updatedFiles);

    // 3. Bubble up the complete cumulative array to the parent form
    onImagesSelected(updatedFiles);
  };

  const handleRemoveImage = (indexToRemove) => {
    // Clean up memory leaks by revoking object URL before removing
    URL.revokeObjectURL(previews[indexToRemove]);

    const updatedPreviews = previews.filter((_, idx) => idx !== indexToRemove);
    const updatedFiles = rawFiles.filter((_, idx) => idx !== indexToRemove);

    setPreviews(updatedPreviews);
    setRawFiles(updatedFiles);
    onImagesSelected(updatedFiles); // Inform parent form of the update
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previews.map((src, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
            <img src={src} alt="Preview" className="w-full h-full object-cover" />
            <button 
              type="button" // Prevents unintentional parent form submission triggers
              onClick={() => handleRemoveImage(idx)}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {previews.length < 4 && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-800/10 transition">
            <ImagePlus className="text-black" />
            <span className="text-xs text-black font-semibold mt-2">Add Image</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>
      <p className="text-xs text-black font-medium">Upload 2 to 4 high-resolution photos of the property.</p>
    </div>
  );
};

export default ImageUploader;