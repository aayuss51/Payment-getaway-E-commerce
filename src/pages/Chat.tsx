import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { ChatThread } from '../types';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Chat = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeChat, setActiveChat] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const searchParams = new URLSearchParams(location.search);
      const redirectPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirectPath}`);
    }
  }, [user, authLoading, navigate, location]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = chatService.subscribeToUserChats(user.uid, (fetchedChats) => {
      setChats(fetchedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const startNewChat = async () => {
      const params = new URLSearchParams(location.search);
      const vendorId = params.get('vendorId');
      const vendorName = params.get('vendor');
      const productName = params.get('product');

      if (user && vendorId && vendorName) {
        setLoading(true);
        try {
          const chatId = await chatService.getOrCreateChat(
            user.uid, 
            vendorId, 
            user.displayName || 'Customer', 
            vendorName
          );
          
          // If product name is provided, send an initial message
          if (productName) {
            // Check if there are already messages in this chat
            // For simplicity, we'll just send it if it's a new chat or just as a context
            await chatService.sendMessage(
              chatId, 
              user.uid, 
              'user', 
              t('interested_in_product', { productName }),
              [user.uid, vendorId]
            );
          }
          
          // Clear query params
          navigate('/chat', { replace: true });
        } catch (error) {
          console.error('Error starting chat:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    startNewChat();
  }, [location.search, user, navigate]);

  // Auto-select the first chat if none active and on desktop
  useEffect(() => {
    if (!activeChat && chats.length > 0 && window.innerWidth >= 768) {
      setActiveChat(chats[0]);
    }
  }, [chats, activeChat]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
        <p className="text-gray-500 font-medium">{t('loading_conversations')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 h-[calc(100vh-14rem)]">
      <div className="flex gap-10 h-full">
        {/* Chat List */}
        <div className={`w-full md:w-96 lg:w-[450px] h-full ${activeChat ? 'hidden md:block' : 'block'}`}>
          <ChatList 
            chats={chats}
            activeChatId={activeChat?.id}
            onChatSelect={setActiveChat}
            currentUserType="user"
          />
        </div>

        {/* Chat Window */}
        <div className={`flex-1 h-full ${!activeChat ? 'hidden md:flex' : 'flex'} flex-col`}>
          {activeChat ? (
            <ChatWindow 
              chatId={activeChat.id}
              currentUserId={user?.uid || ''}
              currentUserType="user"
              chatTitle={activeChat.vendorName}
              participants={activeChat.participants}
              onBack={() => setActiveChat(null)}
            />
          ) : (
            <div className="flex-1 bg-paper rounded-[3rem] lux-border lux-shadow flex flex-col items-center justify-center text-center p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-50/30 opacity-50" />
              <div className="relative z-10">
                <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl border border-red-200">
                  <MessageSquare className="w-16 h-16 text-secondary" />
                </div>
                <h2 className="text-4xl font-serif italic text-primary mb-4">{t('your_messages')}</h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-gold-400" />
                  <p className="text-[10px] font-bold text-secondary  ">{t('select_conversation')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



