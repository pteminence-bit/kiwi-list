import React, { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

const ImageUploader = ({ onImagesSelected }) => {
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + previews.length > 4) {
      alert("Maximum 4 images allowed.");
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    onImagesSelected(files);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previews.map((src, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
            <img src={src} alt="Preview" className="w-full h-full object-cover" />
            <button className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white">
              <X size={14} />
            </button>
          </div>
        ))}
        
        {previews.length < 4 && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-800 transition">
            <ImagePlus className="text-slate-500" />
            <span className="text-xs text-slate-500 mt-2">Add Image</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>
      <p className="text-xs text-slate-500">Upload 2 to 4 high-resolution photos of the property.</p>
    </div>
  );
};

export default ImageUploader;
