import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Ensure react-router-dom is installed
import { API_BASE_URL } from '../config';
import { Landmark } from 'lucide-react';

const EditListing = ({ token }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', address: '', beds: '', baths: ''
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-black mb-6">Edit Listing</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border rounded" />
        <textarea name="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border rounded" />
        <input name="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3 border rounded" />
        <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded">Save Changes</button>
      </form>
    </div>
  );
};

export default EditListing;
