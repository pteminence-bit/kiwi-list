import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Ensure react-router-dom is installed
import { API_BASE_URL } from '../config';
import { Landmark } from 'lucide-react';

const EditListing = ({ token }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    price: '', 
    address: '', 
    beds: '', 
    baths: ''
  });

  // Fetch current listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setFormData(data);
        setLoading(false);
      } catch (err) {
        alert("Failed to load listing");
      }
    };
    fetchListing();
  }, [id, token]);

  // Optimized single change handler for all inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert("Listing updated successfully!");
        window.location.href = "/manage"; // Redirect back to manage page
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2">
        <Landmark className="w-6 h-6" /> Edit Listing
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input 
            name="title" 
            type="text"
            value={formData.title || ''} 
            onChange={handleChange} 
            className="w-full p-3 border rounded" 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            name="description" 
            value={formData.description || ''} 
            onChange={handleChange} 
            className="w-full p-3 border rounded-md min-h-[100px]" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input 
            name="address" 
            type="text"
            value={formData.address || ''} 
            onChange={handleChange} 
            className="w-full p-3 border rounded" 
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input 
              name="price" 
              type="number" 
              value={formData.price || ''} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beds</label>
            <input 
              name="beds" 
              type="number" 
              value={formData.beds || ''} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Baths</label>
            <input 
              name="baths" 
              type="number" 
              value={formData.baths || ''} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditListing;