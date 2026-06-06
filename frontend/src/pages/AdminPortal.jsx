import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Trash2, ShieldX, UserCheck, MessageSquare, Newspaper, ExternalLink } from 'lucide-react';

const AdminPortal = ({ token }) => {
  const [queues, setQueues] = useState({ properties: [], kyc: [], reviews: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const platformUpdates = [
    { date: "Jun 06, 2026", title: "Automated Multi-Queue Engine", body: "Admin dashboards now isolate KYC proofs, reported asset portfolios, and text reviews into explicit separate arrays.", tag: "System Core" },
    { date: "May 18, 2026", title: "Cloudflare R2 Storage Active", body: "Asset media arrays now route cleanly via optimized chunked streams direct to global storage edges.", tag: "Media Pipeline" }
  ];

  const fetchQueues = () => {
    fetch('/api/admin/review-queue', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch queue');
      return data;
    })
    .then((data) => {
      setQueues({
        properties: data.properties || [],
        kyc: data.kyc || [],
        reviews: data.reviews || []
      });
      setLoading(false);
    })
    .catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQueues();
  }, [token]);

  const handleAction = async (targetId, queueType, action) => {
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ targetId, queueType, action })
      });
      if (res.ok) {
        setQueues(prev => ({
          ...prev,
          [queueType]: prev[queueType].filter(item => item.id !== targetId)
        }));
      }
    } catch (err) {
      console.error("Moderation execution loop exception error:", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Accessing secured administration vaults...</div>;

  if (error) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen ml-64 flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center max-w-md shadow-sm">
          <ShieldX className="mx-auto mb-3 text-red-500" size={40} />
          <h3 className="font-bold text-lg mb-1">Access Denied</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <p className="text-xs text-slate-400">Make sure your user profile object has <code className="bg-slate-200 px-1 rounded text-red-600">role: "admin"</code></p>
        </div>
      </div>
    );
  }

  const totalInboundItems = queues.properties.length + queues.kyc.length + queues.reviews.length;

  return (
    <div className="p-8 bg-slate-50 min-h-screen ml-64 text-slate-800">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Admin Portal</h1>
        <p className="text-xs text-slate-500 font-medium">Live System Status Metrics & Governance Review Queues</p>
      </div>

      {/* Top Multi-Queue Metric Ribbon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Pending Assets</span>
          <span className="text-2xl font-black text-slate-900">{queues.properties.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Agent Verification Submissions</span>
          <span className="text-2xl font-black text-slate-900">{queues.kyc.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Total System Alerts</span>
          <span className="text-2xl font-black text-amber-600">{totalInboundItems}</span>
        </div>
      </div>

      {/* Main Structural Twin Columns Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: System Changelogs */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Newspaper size={18} className="text-blue-600" />
            <h3 className="font-extrabold text-slate-900">Platform Updates</h3>
          </div>
          <div className="space-y-4 divide-y divide-slate-100">
            {platformUpdates.map((update, idx) => (
              <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{update.date}</span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">{update.tag}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 mb-1">{update.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{update.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Action Lists */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              <h3 className="font-extrabold text-slate-900">Moderate Activities</h3>
            </div>
            <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded-full font-bold text-slate-600">{totalInboundItems} Pending</span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            
            {/* A. Property Listing Actions Loop */}
            {queues.properties.map(item => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 mb-0.5 flex flex-wrap items-center gap-1.5">
                      Flagged Listing #{item.id.slice(0, 5)}
                      <span className="text-[9px] text-red-600 bg-red-50 px-1.5 rounded font-medium border border-red-100">Reported</span>
                    </div>
                    <p className="text-slate-500 font-medium">{item.title || "Untitled asset Portfolio"} • ₦{item.price?.toLocaleString()}</p>
                    <p className="text-[11px] text-red-600 mt-1 font-medium bg-white px-2 py-1 border border-slate-100 rounded">Reason: {item.reportReason || "Inaccurate item descriptions"}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  <button onClick={() => handleAction(item.id, 'properties', 'approve')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-sm">
                    Approve
                  </button>
                  <button onClick={() => handleAction(item.id, 'properties', 'decline')} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-md transition">
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {/* B. KYC Documents Loop */}
            {queues.kyc.map(item => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 mb-0.5">Agent Verification Request: {item.fullName || "Broker Identity"}</div>
                    <p className="text-slate-500 font-medium">ID Type: {item.idType || "NIN/Passport"} • Doc #{item.idNumber || "XXXX"}</p>
                    {item.documentUrl && (
                      <a href={item.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1 font-bold">
                        View KYC Document File <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  <button onClick={() => handleAction(item.id, 'kyc', 'approve')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-sm">
                    Approve
                  </button>
                  <button onClick={() => handleAction(item.id, 'kyc', 'decline')} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-md transition">
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {/* C. User Reviews Loop */}
            {queues.reviews.map(item => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0 mt-0.5">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 mb-0.5">User Review #{item.id.slice(0, 5)} (Awaiting moderation)</div>
                    <p className="text-slate-600 italic font-medium bg-white px-2 py-1 border border-slate-100 rounded">"{item.reviewText || 'No comment content data body.'}"</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  <button onClick={() => handleAction(item.id, 'reviews', 'approve')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-sm">
                    Approve
                  </button>
                  <button onClick={() => handleAction(item.id, 'reviews', 'decline')} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-md transition">
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {totalInboundItems === 0 && (
              <div className="text-center py-8 text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                No properties, KYC verifications, or profile reviews require attention.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;