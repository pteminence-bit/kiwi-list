import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { Loader2, SendHorizontal } from 'lucide-react';

const ChatMessages = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        const sentMsg = await response.json();
        setMessages([...messages, sentMsg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${msg.senderId === auth.currentUser?.uid ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
        />
        <button 
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition"
        >
          {sending ? <Loader2 className="animate-spin" size={20} /> : <SendHorizontal size={20} />}
        </button>
      </form>
    </div>
  );
};

export default ChatMessages;