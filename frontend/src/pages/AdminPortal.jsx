import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Trash2, ShieldX, UserCheck, MessageSquare, Newspaper, ExternalLink } from 'lucide-react';

// Hardcoded live target address pointing to your active Render Web Service
const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const AdminPortal = ({ token }) => {
  const [queues, setQueues] = useState({ properties: [], kyc: [], reviews: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const platformUpdates = [
    { date: "Jun 06, 2026", title: "Automated Multi-Queue Engine", body: "Admin dashboards now isolate KYC proofs, reported asset portfolios, and text reviews into explicit separate arrays.", tag: "System Core" },
    { date: "May 18, 2026", title: "Cloudflare R2 Storage Active", body: "Asset media arrays now route cleanly via optimized chunked streams direct to global storage edges.", tag: "Media Pipeline" }
  ];

  const fetchQueues = () => {
    fetch(`${BACKEND_BASE_URL}/api/admin/review-queue`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async (res) => {
      // SAFE CHECK: Catch non-JSON HTML error templates before they hit .json()
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned an invalid HTML response (${res.status}). Your backend container may be building or restarting.`);
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch queue data package.');
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
    // Normalizes singular variants ('property', 'review') expected by your Firestore logic rules
    const normalizedQueueType = queueType === 'properties' ? 'property' : queueType === 'reviews' ? 'review' : 'kyc';

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/admin/moderate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ targetId, queueType: normalizedQueueType, action })
      });
      
      if (res.ok) {
        setQueues(prev => ({
          ...prev,
          [queueType]: prev[queueType].filter(item => item.id !== targetId)
        }));
      } else {
        const errorData = await res.json();
        console.error("Moderation decision rejected by backend:", errorData.error);
      }
    } catch (err) {
      console.error("Moderation execution loop exception error:", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Accessing secured administration vaults...</div>;

  if (error) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center max-w-md shadow-sm w-full">
          <ShieldX className="mx-auto mb-3 text-red-500" size={40} />
          <h3 className="font-bold text-lg mb-1">Access Denied</h3>
          <p className="text-sm text-red-600 mb-4 break-words font-mono bg-white p-2 border border-red-100 rounded text-left text-xs">{error}</p>
          <p className="text-xs text-slate-400">If this persists, make sure your token is active and your Firestore document role is explicitly set to <code className="bg-slate-200 px-1 rounded text-red-600">"admin"</code></p>
        </div>
      </div>
    );
  }

  const totalInboundItems = queues.properties.length + queues.kyc.length + queues.reviews.length;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-800 transition-all duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Admin Portal</h1>
        <p className="text-xs text-slate-500 font-medium">Live System Status Metrics & Governance Review Queues</p>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Pending Assets</span>
          <span className="text-2xl font-black text-slate-900">{queues.properties.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Agent KYC Requests</span>
          <span className="text-2xl font-black text-slate-900">{queues.kyc.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sm:col-span-2 md:col-span-1">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Total System Alerts</span>
          <span className="text-2xl font-black text-amber-600">{totalInboundItems}</span>
        </div>
      </div>

      {/* Twin Columns Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: System Changelogs */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-4 order-2 lg:order-1">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Newspaper size={18} className="text-blue-600" />
            <h3 className="font-extrabold text-slate-900">Platform Updates</h3>
          </div>
          <div className="space-y-4 divide-y divide-slate-100">
            {platformUpdates.map((update, idx) => (
              <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">{update.date}</span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full truncate">{update.tag}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 mb-1">{update.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{update.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Action Sub-Queues Loops */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-6 order-1 lg:order-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              <h3 className="font-extrabold text-slate-900">Moderate Activities</h3>
            </div>
            <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded-full font-bold text-slate-600 shrink-0">{totalInboundItems} Pending</span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            
            {/* A. Properties Queue Loop */}
            {queues.properties.map(item => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex gap-3 items-start w-full">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                    <AlertCircle size={16} />
                  </div>
                  <div className="w-full min-w-0">
                    <div className="font-black text-slate-900 mb-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="truncate">Flagged Listing #{item.id.slice(0, 5)}</span>
                      <span className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium border border-red-100 shrink-0">Reported</span>
                    </div>
                    <p className="text-slate-500 font-medium truncate">{item.title || "Untitled property description"} • ₦{item.price?.toLocaleString()}</p>
                    <p className="text-[11px] text-red-600 mt-1.5 font-medium bg-white px-2 py-1 border border-slate-100 rounded break-words">Reason: {item.reportReason || "Inaccurate listing specifications"}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button onClick={() => handleAction(item.id, 'properties', 'approve')} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-sm">
                    Approve
                  </button>
                  <button onClick={() => handleAction(item.id, 'properties', 'decline')} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-md transition">
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {/* B. Agent KYC Request Loop */}
            {queues.kyc.map(item => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex gap-3 items-start w-full">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <UserCheck size={16} />
                  </div>
                  <div className="w-full min-w-0">
                    <div className="font-black text-slate-900 mb-0.5 truncate">Agent KYC: {item.fullName || "Anonymous Broker"}</div>
                    <p className="text-slate-500 font-medium truncate">ID: {item.idType || "NIN"} • #{item.idNumber || "XXXX"}</p>
                    {item.documentUrl && (
                      <a href={item.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1.5 font-bold||">
                        View KYC Document File <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button onClick={() => handleAction(item.id, 'kyc', 'approve')} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-sm">
                    Approve
                  </button>
                  <button onClick={() => handleAction(item.id, 'kyc', 'decline')} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-md transition">
                    Decline
                  </button>
                </div>
              </div>
            ))}

            {/* C. User Reviews Loop */}
            {queues.reviews.map(item => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex gap-3 items-start w-full">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                    <MessageSquare size={16} />
                  </div>
                  <div className="w-full min-w-0">
                    <div className="font-black text-slate-900 mb-0.5 truncate">User Review #{item.id.slice(0, 5)}</div>
                    <p className="text-slate-600 italic font-medium bg-white px-2 py-1 border border-slate-100 rounded mt-1 break-words">"{item.reviewText || 'Empty text field feedback submission.'}"</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button onClick={() => handleAction(item.id, 'reviews', 'approve')} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-sm">
                    Approve
                  </button>
                  <button onClick={() => handleAction(item.id, 'reviews', 'decline')} className="flex-1 sm:flex-none px-4 py-2 sm:py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-md transition">
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