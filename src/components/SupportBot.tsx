import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Loader2, Bot, User, Shield } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';

import { useTranslation } from 'react-i18next';

export const SupportBot = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot' | 'admin', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate or retrieve a guest ID if not logged in
  const getSessionId = () => {
    if (profile?.uid) return profile.uid;
    let gid = localStorage.getItem('bazaar_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('bazaar_guest_id', gid);
    }
    return gid;
  };

  const sessionId = getSessionId();

  useEffect(() => {
    if (isOpen) {
      const path = 'support_messages';
      const q = query(
        collection(db, path),
        where('threadId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({
          role: doc.data().sender === 'user' ? 'user' : (doc.data().sender === 'admin' ? 'admin' : 'bot'),
          text: doc.data().text
        })) as { role: 'user' | 'bot' | 'admin', text: string }[];

        if (fetchedMessages.length === 0) {
          setMessages([
            { role: 'bot', text: t('bot_greeting') }
          ]);
        } else {
          setMessages(fetchedMessages);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });

      return () => unsubscribe();
    }
  }, [profile, isOpen]);

  const scrollToBottom = () => {
    if (messagesEndRef.current?.parentElement) {
      messagesEndRef.current.parentElement.scrollTop = messagesEndRef.current.parentElement.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const msgPath = 'support_messages';
    const threadPath = `support_threads/${sessionId}`;

    try {
      // 1. Save user message to Firestore
      await addDoc(collection(db, msgPath), {
        threadId: sessionId,
        text: userMessage,
        sender: 'user',
        timestamp: serverTimestamp(),
        userName: profile?.displayName || 'Guest User',
        userEmail: profile?.email || 'guest@bazaar.np'
      });

      // 2. Update or create support thread
      const threadRef = doc(db, 'support_threads', sessionId);
      await setDoc(threadRef, {
        userId: sessionId,
        userName: profile?.displayName || 'Guest User',
        userEmail: profile?.email || 'guest@bazaar.np',
        lastMessage: userMessage,
        lastMessageAt: serverTimestamp(),
        status: 'open',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. AI Bot Response
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
      
      // Fallback to a polite message if no API key is available
      if (!apiKey) {
        console.warn("GEMINI_API_KEY not found. Please add it to your project secrets in Settings.");
        const fallbackMsg = "Thank you for your message! Our human support team (Puja and others) will check your request and get back to you shortly. You can also reach us at supportbazaar@gmail.com.";
        
        await addDoc(collection(db, msgPath), {
          threadId: sessionId,
          text: fallbackMsg,
          sender: 'bot',
          timestamp: serverTimestamp()
        });
        return;
      }
      
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Include some history for context (last 5 messages)
        const recentHistory = messages
          .slice(-5)
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }));

        // Add current message to contents
        const contents = [
          ...recentHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ];

        const genAIResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: contents,
          config: {
            systemInstruction: "You are Puja (Support Team) for 'Bazaar', a friendly and helpful AI FAQ bot for a multi-vendor e-commerce marketplace in Nepal. Your primary role is to answer Frequently Asked Questions (FAQ) regarding orders, shipping, vendor registration, and general inquiries. Keep responses concise and friendly. IMPORTANT RULES: 1) Your very first reply to a user MUST start with a warm welcome message to Bazaar. 2) Do not use asterisks (*) or underscores (_) for bolding or lists. Use plain text or simple dashes for lists. 3) Always identify as Puja from the Bazaar Support Team. 4) You must understand and reply in Nepali if the user asks questions or chats in Nepali. 5) If you cannot solve a problem or don't know the answer, tell the user that a human agent will be with them shortly. Contact: supportbazaar@gmail.com, +977 9764453517."
          }
        });

        const botResponse = (genAIResponse.text || "I'm sorry, I couldn't process that right now. A human support agent will be with you shortly.").replace(/[\*_]/g, '');
        
        // 4. Save bot response to Firestore
        await addDoc(collection(db, msgPath), {
          threadId: sessionId,
          text: botResponse,
          sender: 'bot',
          timestamp: serverTimestamp()
        });
      } catch (aiError) {
        console.error("AI Generation Error:", aiError);
        const errorMsg = "I encountered a technical issue while processing your request. Please try again or wait for a human agent to assist you.";
        await addDoc(collection(db, msgPath), {
          threadId: sessionId,
          text: errorMsg,
          sender: 'bot',
          timestamp: serverTimestamp()
        });
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, msgPath);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-72 sm:w-96 h-[400px] sm:h-[500px] max-h-[calc(100vh-180px)] bg-white/40 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-secondary/60 backdrop-blur-md p-4 sm:p-5 flex items-center justify-between text-white border-b border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative group/avatar">
                  <div className="absolute inset-0 bg-white/20 rounded-xl blur-md group-hover/avatar:blur-lg transition-all" />
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                    alt={t('puja_name')}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-white/40 relative z-10 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-lg z-20" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base !text-white" style={{ color: 'white' }}>{t('puja_name')}</h3>
                    <span className="flex items-center gap-1 text-[8px] font-black bg-white/30 backdrop-blur-md text-white px-2 py-0.5 rounded-full border border-white/20">
                      <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                      {t('online')}
                    </span>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-white/90 font-medium tracking-wide">{t('expert_helpdesk')}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 font-sans relative"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 0%, rgba(0, 71, 171, 0.05) 0%, transparent 70%)`,
                backgroundColor: 'transparent',
              }}
            >
              <div className="flex justify-center mb-6">
                <span className="bg-white/30 backdrop-blur-xl text-[10px] text-white px-4 py-1.5 rounded-full border border-white/20   font-black shadow-lg">
                  {t('secure_chat_session')}
                </span>
              </div>
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                      msg.role === 'user' ? 'bg-secondary/10 text-secondary' : 
                      msg.role === 'admin' ? 'bg-secondary text-white' :
                      'bg-white border border-gray-100'
                    }`}>
                      {msg.role === 'user' ? (
                        profile?.photoURL ? (
                          <img 
                            src={profile.photoURL} 
                            alt={profile.displayName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs font-bold">{profile?.displayName?.[0] || 'U'}</span>
                        )
                      ) : msg.role === 'admin' ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <img 
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" 
                          alt="Puja ( Support Team )"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className={`p-4 rounded-[1.5rem] text-[13px] leading-relaxed shadow-sm relative backdrop-blur-md border ${
                      msg.role === 'user' 
                        ? 'bg-secondary/80 text-white rounded-tr-none border-secondary/50' 
                        : msg.role === 'admin'
                        ? 'bg-gray-900/80 text-white rounded-tl-none border-gray-700/50'
                        : 'bg-white/60 border-white/40 text-gray-700 rounded-tl-none'
                    }`}>
                      {msg.role === 'bot' && (
                        <div className="text-[10px] font-bold text-secondary mb-1 opacity-70">Puja</div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm font-sans">
                    <div className="flex gap-1">
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                        className="w-1.5 h-1.5 bg-secondary" 
                      />
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-secondary" 
                      />
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-secondary" 
                      />
                    </div>
                    <span className="text-[11px] text-secondary font-black  ">{t('typing')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white/20 backdrop-blur-xl border-t border-white/10 flex gap-2 font-sans">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('type_message')}
                className="flex-1 bg-white/40 backdrop-blur-md border border-white/20 focus:ring-2 focus:ring-secondary/50 rounded-2xl px-4 py-2 text-sm outline-none placeholder:text-gray-500"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-secondary text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary text-white rounded-2xl shadow-2xl shadow-black/30 flex items-center justify-center transition-all duration-300 group"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </div>
  );
};



