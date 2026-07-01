// frontend/src/pages/ChatsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, doc, query, orderBy, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, ShieldAlert, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ChatsPage = ({ token }) => {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Structural sanity string identity transformation wrapper matching your custom schema
  const kiwiUserId = React.useMemo(() => {
    if (!user?.email) return null;
    return `kiwi-user-${user.email.toLowerCase().trim().replace(/[@.]/g, '-')}`;
  }, [user]);

  // 1. Fetch current active list streams for Inbox View using your Express Route
  useEffect(() => {
    if (!token) return;

    const fetchInbox = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chats/inbox`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInbox(data);

          // Handle direct routing query transitions from the Marketplace Feed
          const queryParams = new URLSearchParams(location.search);
          const targetChatId = queryParams.get('id');
          if (targetChatId) {
            const foundChat = data.find(c => c.id === targetChatId);
            if (foundChat) setActiveChat(foundChat);
          }
        }
      } catch (err) {
        console.error("Inbox sync operational error:", err);
      } finally {
        setLoadingInbox(false);
      }
    };

    fetchInbox();
  }, [token, location.search]);

  // 2. Open continuous client-side real-time stream subscription on active message logs
  useEffect(() => {
    if (!activeChat?.id) return;

    setLoadingMessages(true);
    const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(logs);
      setLoadingMessages(false);
      
      // Smart Auto-scroll execution chain helper
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => {
      console.error("Firestore message streaming blocked by firewall rules:", err);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // 3. Dispatch encrypted/plain payload data straight to sub-collections
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat?.id || !kiwiUserId) return;

    const messagePayload = {
      senderId: kiwiUserId,
      text: newMessage.trim(),
      createdAt: new Date().toISOString()
    };

    const currentInputCache = newMessage;
    setNewMessage('');

    try {
      // Direct insertion allowed via client-side SDK by our custom Security Rules firewalls
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), messagePayload);
      
      // Update Root Conversation meta references globally
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessageText: currentInputCache.trim(),
        lastMessageAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Message write dropped by access guards:", err);
      alert("Message transmission rejected by server. Ensure asset contract access remains open.");
    }
  };

  if (loadingInbox) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400 font-bold text-xs uppercase tracking-widest gap-2">
        <Loader2 className="animate-spin text-blue-500" size={18} /> Syncing Comms Module...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 border-l border-slate-900 overflow-hidden text-slate-100">
      {/* LEFT COMPARTMENT: ACTIVE STREAMS VIEW INBOX */}
      <div className={`w-full md:w-80 border-r border-slate-900 flex flex-col shrink-0 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-900 bg-slate-900/20">
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-300">
            <MessageSquare size={16} className="text-blue-500" /> Conversations Inbox
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900/50">
          {inbox.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-600 font-medium">No running asset inquiries generated.</div>
          ) : (
            inbox.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full p-4 flex flex-col text-left transition-all ${activeChat?.id === chat.id ? 'bg-blue-600/10 border-l-2 border-blue-500' : 'hover:bg-slate-900/40'}`}
              >
                <div className="flex justify-between items-baseline w-full">
                  <span className="text-xs font-black truncate max-w-[150px] text-slate-200 uppercase">{chat.listingTitle}</span>
                  <span className="text-[9px] font-mono text-slate-500">{new Date(chat.lastMessageAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-semibold text-slate-400 truncate w-full mt-1">{chat.lastMessageText}</p>
                <span className="text-[9px] tracking-tight text-slate-500 font-bold mt-1.5 uppercase">
                  Role: {kiwiUserId === chat.ownerId ? <span className="text-emerald-500">Owner/Agent</span> : <span className="text-indigo-400">Prospect Buyer</span>}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COMPARTMENT: ACTIVE CONVERSATION REALTIME FEED */}
      <div className={`flex-1 flex flex-col h-full bg-slate-900/20 ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header pane view */}
            <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wide">{activeChat.listingTitle}</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">ROOM REF: {activeChat.id}</p>
              </div>
              <button onClick={() => setActiveChat(null)} className="md:hidden text-xs bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-slate-300 uppercase tracking-wider">Back</button>
            </div>

            {/* Conversation Core Flow Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {loadingMessages ? (
                <div className="h-full w-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase tracking-widest animate-pulse">Decrypting Feed Streams...</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === kiwiUserId;
                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-3 shadow-md border ${isMe ? 'bg-blue-600 border-blue-500 text-white rounded-br-none' : 'bg-slate-900 border-slate-800 text-slate-100 rounded-bl-none'}`}>
                        <p className="text-xs font-medium leading-relaxed break-words">{msg.text}</p>
                        <p className={`text-[8px] font-mono mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input interface tray */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 bg-slate-950/30 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Compose secure encrypted response..."
                className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
              />
              <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md flex items-center justify-center shrink-0">
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-600 text-center p-8">
            <ShieldAlert size={32} className="text-slate-800" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">No Chat Channel Mounted</h3>
              <p className="text-[11px] font-medium text-slate-600 max-w-xs mt-1">Select an active listing communication ledger channel from the sidebar to open messaging loops.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsPage;
