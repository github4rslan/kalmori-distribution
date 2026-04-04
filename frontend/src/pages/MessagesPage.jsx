import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { ChatCircle, PaperPlaneTilt, User, ArrowLeft, Circle } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const userId = (() => {
    try { return JSON.parse(atob(token.split('.')[1])).sub; } catch { return ''; }
  })();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/messages/conversations`, { headers });
      if (res.ok) setConversations(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  const fetchMessages = useCallback(async (convoId) => {
    try {
      const res = await fetch(`${API}/api/messages/${convoId}`, { headers });
      if (res.ok) {
        setMessages(await res.json());
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo);
    // Poll for new messages every 4 seconds
    pollRef.current = setInterval(() => {
      fetchMessages(activeConvo);
      fetchConversations();
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [activeConvo, fetchMessages, fetchConversations]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvo) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/messages/${activeConvo}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMsg }),
      });
      if (res.ok) {
        setNewMsg('');
        fetchMessages(activeConvo);
        fetchConversations();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to send');
      }
    } catch (e) { toast.error('Failed to send message'); }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const activeConvoData = conversations.find(c => c.id === activeConvo);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] flex" data-testid="messages-page">
        {/* Conversation List */}
        <div className={`${activeConvo ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-[#222] bg-[#0a0a0a]`}>
          <div className="p-4 border-b border-[#222]">
            <h2 className="text-white font-bold text-lg" data-testid="messages-title">Messages</h2>
            <p className="text-gray-500 text-xs mt-0.5">Chat with your collaborators</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <ChatCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-600 text-xs mt-1">Accept a collab invite to start chatting</p>
              </div>
            ) : conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConvo(c.id)}
                className={`w-full p-3 flex items-center gap-3 border-b border-[#181818] text-left transition hover:bg-[#151515] ${activeConvo === c.id ? 'bg-[#151515] border-l-2 border-l-[#7C4DFF]' : ''}`}
                data-testid={`convo-${c.id}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#7C4DFF]/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-[#7C4DFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium truncate">{c.other_user?.artist_name || 'Unknown'}</p>
                    <span className="text-[10px] text-gray-600 shrink-0">{formatTime(c.last_message?.created_at)}</span>
                  </div>
                  <p className="text-gray-500 text-xs truncate">{c.last_message?.text || c.post_title}</p>
                </div>
                {c.unread_count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#7C4DFF] text-white text-[10px] font-bold flex items-center justify-center shrink-0" data-testid={`unread-${c.id}`}>
                    {c.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!activeConvo ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-black`}>
          {!activeConvo ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatCircle className="w-16 h-16 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-lg font-medium">Select a conversation</p>
                <p className="text-gray-600 text-sm mt-1">Pick a collaborator to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#222] flex items-center gap-3">
                <button
                  onClick={() => setActiveConvo(null)}
                  className="md:hidden text-gray-400 hover:text-white"
                  data-testid="back-btn"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-[#E040FB]/20 flex items-center justify-center">
                  <User className="w-4.5 h-4.5 text-[#E040FB]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm" data-testid="chat-partner-name">
                    {activeConvoData?.other_user?.artist_name || 'Collaborator'}
                  </p>
                  <p className="text-gray-500 text-xs">{activeConvoData?.post_title}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messages-list">
                {messages.map(msg => {
                  const isMe = msg.sender_id === userId;
                  const isSystem = msg.sender_id === 'system';
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-[#7C4DFF]/10 text-[#7C4DFF] text-xs border border-[#7C4DFF]/20">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`} data-testid={`msg-${msg.id}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? 'bg-[#7C4DFF] text-white rounded-br-md'
                          : 'bg-[#1a1a1a] text-gray-200 border border-[#222] rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-gray-600'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-[#222]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C4DFF] placeholder-gray-600"
                    data-testid="message-input"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMsg.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-[#7C4DFF] text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition"
                    data-testid="send-message-btn"
                  >
                    <PaperPlaneTilt className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
