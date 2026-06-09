// src/pages/AdminPortal.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Trash2, ShieldX, UserCheck, MessageSquare, Newspaper, ExternalLink, Users, Ban, Landmark, ShieldCheck, X, Eye } from 'lucide-react';

// Hardcoded live target address pointing to your active Render Web Service
const BACKEND_BASE_URL = 'https://kiwi-list-api.onrender.com';

const AdminPortal = ({ token }) => {
  const [queues, setQueues] = useState({ properties: [], kyc: [], reviews: [], users: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NEW VIEW SWITCH STATE: Toggles layout space between operational queues and user directory controls
  const [activeTab, setActiveTab] = useState('moderation'); 

  // NEW STATE TRACKER: Handles active targeted viewing injection mapping data payloads for the KYC modal panel
  const [selectedKyc, setSelectedKyc] = useState(null);

  const platformUpdates = [
    { date: "Jun 08, 2026", title: "Financial Governance Framework", body: "Admins can now revoke withdrawal permissions and disable compromised user/broker portfolios globally.", tag: "Wallets Guard" },
    { date: "Jun 06, 2026", title: "Automated Multi-Queue Engine", body: "Admin dashboards now isolate KYC proofs, reported asset portfolios, and text reviews into explicit separate arrays.", tag: "System Core" },
    { date: "May 18, 2026", title: "Cloudflare R2 Storage Active", body: "Asset media arrays now route cleanly via optimized chunked streams direct to global storage edges.", tag: "Media Pipeline" }
  ];

  const fetchQueues = () => {
    fetch(`${BACKEND_BASE_URL}/api/admin/review-queue`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async (res) => {
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
        reviews: data.reviews || [],
        users: data.users || []
      });
      setLoading(false)
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
    // Normalizes queue strings expected by your Firestore logic rules
    const normalizedQueueType = 
      queueType === 'properties' ? 'property' : 
      queueType === 'reviews' ? 'review' : 
      queueType === 'users' ? 'user' : 'kyc';

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
        // Close modal if the currently reviewed KYC item gets processed
        if (queueType === 'kyc' && selectedKyc?.id === targetId) {
          setSelectedKyc(null);
        }

        // NEW IMPLEMENTATION: For account updates, perform local inline data state mapping mutations
        if (queueType === 'users') {
          setQueues(prev => ({
            ...prev,
            users: prev.users.map(user => {
              if (user.id !== targetId) return user;
              if (action === 'disable') return { ...user, isDisabled: true };
              if (action === 'enable') return { ...user, isDisabled: false };
              if (action === 'block_payout') return { ...user, isPayoutBlocked: true };
              if (action === 'unblock_payout') return { ...user, isPayoutBlocked: false };
              return user;
            })
          }));
        } else {
          // For typical review queues, filter out the resolved data object entries cleanly
          setQueues(prev => ({
            ...prev,
            [queueType]: prev[queueType].filter(item => item.id !== targetId)
          }));
        }
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
      
      {/* HEADER WITH VIEW TOGGLE SWITCH */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Admin Portal</h1>
          <p className="text-xs text-slate-500 font-medium">Live System Status Metrics & Governance Review Queues</p>
        </div>
        
        {/* NEW TOP-RIGHT TOGGLE BUTTON COMPONENT BLOCK */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center shrink-0 w-full sm:w-auto shadow-inner">
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-lg font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'moderation' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle size={14} /> Moderate Activities ({totalInboundItems})
          </button>
          <button 
            onClick={() => setActiveTab('governance')}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-lg font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'governance' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} /> Account Guards ({queues.users.length})
          </button>
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Pending Assets</span>
          <span className="text-2xl font-black text-slate-900">{queues.properties.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Agent KYC Requests</span>
          <span className="text-2xl font-black text-slate-900">{queues.kyc.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Registered Accounts</span>
          <span className="text-2xl font-black text-slate-900">{queues.users.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Total System Alerts</span>
          <span className="text-2xl font-black text-amber-600">{totalInboundItems}</span>
        </div>
      </div>

      {/* DYNAMIC WORKSPACE ARCHITECTURE: Conditionally changes view based on active tab state */}
      {activeTab === 'moderation' ? (
        /* VIEW 1: OPERATIONAL MODERATION MODULE QUEUE SELECTION (DEFAULT) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          
          {/* Left Column: Platform Changelogs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-4">
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
          </div>

          {/* Right Column: Active Inbound Verification & Moderation Pipeline Cards */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-slate-900">Moderate Activities</h3>
              </div>
              <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded-full font-bold text-slate-600 shrink-0">{totalInboundItems} Pending</span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {/* Properties Queue Loop */}
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

              {/* Agent KYC Request Loop */}
              {queues.kyc.map(item => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex gap-3 items-start w-full">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <UserCheck size={16} />
                    </div>
                    <div className="w-full min-w-0">
                      <div className="font-black text-slate-900 mb-0.5 truncate">Agent KYC: {item.fullName || "Anonymous Broker"}</div>
                      <p className="text-slate-500 font-medium truncate">ID: {item.idType || "NIN"} • #{item.idNumber || "XXXX"}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={() => setSelectedKyc(item)}
                          className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded hover:bg-blue-100 transition font-bold"
                        >
                          <Eye size={12} /> Review Details & Logs
                        </button>
                        
                        {item.documentUrl && (
                          <a href={item.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 hover:underline font-bold">
                            Open Direct File <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
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

              {/* User Reviews Loop */}
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
      ) : (
        /* VIEW 2: FULL COMPREHENSIVE GOVERNANCE VIEW (DISABLING, BLOCKING WITHDRAWALS, ETC) */
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4 max-w-4xl mx-auto w-full animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users size={20} className="text-indigo-600" />
            <div>
              <h3 className="font-black text-lg text-slate-900">User Account Controls</h3>
              <p className="text-xs text-slate-400">Manage digital transaction permissions and globally suspension parameters</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[650px] overflow-y-auto pr-1">
            {queues.users.map(user => (
              <div key={user.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 truncate">{user.fullName || user.email || "Anonymous User"}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">UID: {user.id}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 items-end">
                      {user.isDisabled && <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded font-bold text-[9px]">Disabled</span>}
                      {user.isPayoutBlocked && <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded font-bold text-[9px]">Payout Blocked</span>}
                    </div>
                  </div>
                  
                  <div className="text-[11px] text-slate-500 font-medium space-y-0.5 pt-1">
                    <p>Registered Email: <span className="text-slate-700 font-mono">{user.email || 'N/A'}</span></p>
                    <p>Current Role Profile: <span className="text-slate-800 font-bold capitalize">{user.role || 'user'}</span></p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                  {/* Account Enable/Disable Trigger */}
                  {user.isDisabled ? (
                    <button 
                      onClick={() => handleAction(user.id, 'users', 'enable')}
                      className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 transition text-center text-[11px]"
                    >
                      Enable Account
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAction(user.id, 'users', 'disable')}
                      className="flex-1 py-2 px-3 bg-white text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-50 transition flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <Ban size={12} /> Disable Account
                    </button>
                  )}

                  {/* Withdrawal Guard Lock/Unlock Trigger */}
                  {user.isPayoutBlocked ? (
                    <button 
                      onClick={() => handleAction(user.id, 'users', 'unblock_payout')}
                      className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-100 transition text-center text-[11px]"
                    >
                      Lift Payout Block
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAction(user.id, 'users', 'block_payout')}
                      className="flex-1 py-2 px-3 bg-white text-amber-700 border border-amber-200 rounded-lg font-bold hover:bg-amber-50 transition flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <Landmark size={12} /> Block Payout
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {queues.users.length === 0 && (
              <p className="text-center text-slate-400 italic text-xs col-span-2 py-8">No users found registered in cluster nodes.</p>
            )}
          </div>
        </div>
      )}

      {/* NEW PANEL OVERLAY: Comprehensive Slide-Out KYC Document Viewer Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-slideLeft">
            
            <div>
              {/* Modal Top Branding Elements */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-blue-600" size={22} />
                  <div>
                    <h3 className="font-black text-slate-900 text-base">KYC Dossier Review</h3>
                    <p className="text-xs text-slate-400">UID: <span className="font-mono">{selectedKyc.id}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedKyc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Broker Information Fields */}
              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Broker Metadata Profile</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-700 pt-1">
                    <p className="font-medium">Full Legal Name:</p>
                    <p className="font-black text-slate-900 text-right">{selectedKyc.legalFullName || "N/A"}</p>
                    
                    <p className="font-medium">Account Email:</p>
                    <p className="font-mono text-slate-900 text-right truncate">{selectedKyc.email || "N/A"}</p>

                    <p className="font-medium">Document Type:</p>
                    <p className="font-bold text-slate-900 text-right uppercase">{selectedKyc.idType || "NIN"}</p>

                    <p className="font-medium">Document Number:</p>
                    <p className="font-mono text-slate-900 text-right font-bold">{selectedKyc.kycIdNumber || "N/A"}</p>
                  </div>
                </div>

                {/* Secure Document Iframe Preview Window */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uploaded Proof Attachment</span>
                  {selectedKyc.documentUrl ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 relative aspect-[4/3] flex flex-col items-center justify-center">
                      {/* FIXED: Splits away query param parameters/signatures to successfully read storage image extensions */}
                      {selectedKyc.documentUrl.split('?')[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img 
                          src={selectedKyc.kycDocumentUrl} 
                          alt="KYC Identification Proof" 
                          className="w-full h-full object-contain bg-slate-900" 
                        />
                      ) : (
                        <iframe 
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedKyc.documentUrl)}&embedded=true`} 
                          title="KYC Proof Frame"
                          className="w-full h-full border-0"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs italic bg-slate-50">
                      No document attachment present in this profile node payload.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Operational Controls */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 bg-white">
              <button 
                onClick={() => handleAction(selectedKyc.id, 'kyc', 'approve')}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1"
              >
                <ShieldCheck size={14} /> Approve & Grant Agent Role
              </button>
              <button 
                onClick={() => handleAction(selectedKyc.id, 'kyc', 'decline')}
                className="px-4 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition"
              >
                Decline Proof
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;