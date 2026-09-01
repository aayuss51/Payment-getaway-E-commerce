import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Store, Loader2, ArrowLeft, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { ChatMessage, ChatThread } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  currentUserType: 'user' | 'vendor';
  onBack?: () => void;
  chatTitle: string;
  participants: string[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chatId, 
  currentUserId, 
  currentUserType, 
  onBack,
  chatTitle,
  participants
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = chatService.subscribeToMessages(chatId, currentUserId, (fetchedMessages) => {
      // Check for new incoming messages to show notification
      if (messages.length > 0 && fetchedMessages.length > messages.length) {
        const lastMsg = fetchedMessages[fetchedMessages.length - 1];
        if (lastMsg.sender !== currentUserId) {
          showNotification(lastMsg.text);
        }
      }
      setMessages(fetchedMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  const showNotification = (text: string) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(chatTitle, {
        body: text,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await chatService.sendMessage(chatId, currentUserId, currentUserType, text, participants);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const isSelf = participants.length === 2 && participants[0] === participants[1];
  const displayTitle = isSelf ? "Message Yourself (You)" : chatTitle;

  return (
    <div className="flex flex-col h-full bg-chat-bg rounded-[2rem] lux-border shadow-2xl overflow-hidden relative">
      {/* WhatsApp Background Pattern */}
      <div className="absolute inset-0 chat-bg-pattern opacity-60 pointer-events-none" />

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-red-200/30 flex items-center gap-4 lux-glass z-20">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 rounded-full transition-all md:hidden text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center overflow-hidden lux-border shadow-sm">
          {currentUserType === 'vendor' ? <User className="w-6 h-6 text-secondary" /> : <Store className="w-6 h-6 text-secondary" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif italic text-xl text-primary truncate leading-none">{displayTitle}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className="text-[10px] font-bold text-gray-400  ">Always Available</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-paper/80 backdrop-blur rounded-[2rem] flex items-center justify-center mb-6 lux-shadow border border-red-100">
              <MessageSquare className="w-10 h-10 text-red-200" />
            </div>
            <p className="text-gray-400 font-serif italic bg-paper/30 backdrop-blur-sm px-6 py-3 rounded-full text-sm border border-red-100/30">
              Conversations are private & secure.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender === currentUserId;
            const showTail = index === 0 || messages[index - 1].sender !== msg.sender;
            
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm relative ${
                  isOwn 
                    ? 'bg-secondary text-white rounded-tr-none' 
                    : 'bg-white text-primary rounded-tl-none border border-red-100/50'
                }`}>
                  {showTail && (
                    <div className={`absolute top-0 w-3 h-3 ${
                      isOwn 
                        ? '-right-1.5 bg-secondary [clip-path:polygon(0_0,100%_0,0_100%)]' 
                        : '-left-1.5 bg-white [clip-path:polygon(0_0,100%_0,100%_100%)]'
                    }`} />
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-[15px] font-sans font-medium">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1.5 mt-1 ${isOwn ? 'mr-0' : ''}`}>
                    <span className={`text-[9px] font-bold ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                    {isOwn && (
                      <CheckCheck className="w-3.5 h-3.5 text-white/90" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area wrapper with glassmorphism */}
      <div className="p-4 sm:p-6 p-2 lux-glass border-t border-red-200/30 z-20">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex-1 bg-paper/50 border border-red-200/30 rounded-full flex items-center px-6 py-2 shadow-inner">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Your inquiry..."
              className="flex-1 py-2 bg-transparent border-none focus:ring-0 outline-none text-[15px] font-serif italic text-primary placeholder:text-gray-300"
            />
          </div>
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-14 h-14 bg-secondary text-paper rounded-full flex items-center justify-center transition-all duration-500 shadow-xl disabled:opacity-30 shrink-0"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};



