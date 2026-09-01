import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Shield, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

export const VendorSupport = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<{ id: string; sender: string; text: string; timestamp: any }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionId = profile?.uid || 'anonymous_vendor';

  useEffect(() => {
    const path = 'support_messages';
    const q = query(
      collection(db, path),
      where('threadId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      setMessages(fetchedMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const msgPath = 'support_messages';

    try {
      // 1. Save user message to Firestore
      await addDoc(collection(db, msgPath), {
        threadId: sessionId,
        text: userMessage,
        sender: 'user',
        timestamp: serverTimestamp(),
        userName: profile?.displayName || 'Vendor',
        userEmail: profile?.email || '',
        userType: 'vendor'
      });

      // 2. Update or create support thread
      const threadRef = doc(db, 'support_threads', sessionId);
      await setDoc(threadRef, {
        userId: sessionId,
        userName: profile?.displayName || 'Vendor',
        userEmail: profile?.email || '',
        userType: 'vendor',
        lastMessage: userMessage,
        lastMessageAt: serverTimestamp(),
        status: 'open',
        updatedAt: serverTimestamp(),
        source: 'vendor_dashboard'
      }, { merge: true });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, msgPath);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="flex justify-center">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 max-w-md text-center space-y-2 mb-8">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-bold text-gray-900">Bazaar Support Center</h3>
            <p className="text-xs text-gray-500">How can we help you today? Our average response time for vendors is under 4 hours.</p>
          </div>
        </div>

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No messages yet. Send a message to start a conversation with support.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.sender === 'user' ? 'bg-secondary/10 text-secondary' : 'bg-secondary text-white'
              }`}>
                {msg.sender === 'user' ? (
                  profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-xs font-bold">{profile?.displayName?.[0]}</span>
                  )
                ) : (
                  <Shield className="w-4 h-4 text-secondary" />
                )}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-secondary text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
              }`}>
                {msg.sender !== 'user' && (
                  <div className="text-[10px] font-black text-secondary   mb-1">Support Team</div>
                )}
                {msg.text}
                {msg.timestamp && (
                  <div className={`text-[8px] mt-1 font-bold ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-50 bg-gray-50/30">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 w-full">
            {['Order Issue', 'Product Approval', 'Payment Query', 'Account Help'].map((tag) => (
              <button
                key={tag}
                onClick={() => setInput(prev => prev ? `${prev} [${tag}]` : `[${tag}] `)}
                className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your issue or ask a question..."
              className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-secondary transition-all outline-none shadow-sm"
            />
          </div>
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-secondary text-white px-8 rounded-2xl font-bold transition-all shadow-lg shadow-secondary/10 flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="hidden sm:inline">Send Message</span>
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-4 font-medium italic">
          Bazaar Support is available Sunday to Friday, 9 AM - 6 PM NPT. 
          For urgent account issues, please call our hotline.
        </p>
      </div>
    </div>
  );
};



